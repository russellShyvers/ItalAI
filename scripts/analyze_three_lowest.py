#!/usr/bin/env python3
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional


def parse_timestamp(name: str) -> str:
    """Return timestamp token YYYY_MM_DD_HH_MM_SS from report filename."""
    m = re.search(r"(\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2})", name)
    return m.group(1) if m else ""


def slug_from_name(name: str) -> str:
    """Derive slug prefix before the timestamp token (trim trailing separators)."""
    ts = parse_timestamp(name)
    if not ts:
        return name
    idx = name.find(ts)
    slug = name[:idx].rstrip("-_ .")
    return slug or "root"


def summarize_group(items: List[Tuple[str, Path]], tail: int = 10):
    """Take the latest N reports for a slug and return averages plus latest path."""
    # sort by timestamp/mtime ascending, then take the tail
    keyed = []
    for ts, p in items:
        key = ts or p.stat().st_mtime
        keyed.append((key, p))
    keyed.sort(key=lambda x: x[0])
    tail_items = keyed[-tail:]

    perf_sum = 0.0
    lcp_sum = 0.0
    fcp_sum = 0.0
    count = 0

    for _, path in tail_items:
        try:
            data = json.loads(path.read_text())
        except Exception:
            continue
        perf = data.get('categories', {}).get('performance', {}).get('score')
        lcp = data.get('audits', {}).get('largest-contentful-paint', {}).get('numericValue')
        fcp = data.get('audits', {}).get('first-contentful-paint', {}).get('numericValue')
        if isinstance(perf, (int, float)):
            perf_sum += perf
        if isinstance(lcp, (int, float)):
            lcp_sum += lcp
        if isinstance(fcp, (int, float)):
            fcp_sum += fcp
        count += 1

    latest_path: Optional[Path] = tail_items[-1][1] if tail_items else None
    return {
        'avg_perf': (perf_sum / count) if count else 0.0,
        'avg_lcp_ms': (lcp_sum / count) if count else 0.0,
        'avg_fcp_ms': (fcp_sum / count) if count else 0.0,
        'count': count,
        'latest_path': latest_path,
    }


def collect_latest_summaries(reports_dir: Path, tail: int = 10) -> Dict[str, dict]:
    """Group reports by slug and return averaged summaries using the last N per slug."""
    groups: Dict[str, List[Tuple[str, Path]]] = {}
    for path in reports_dir.glob("*.report.json"):
        slug = slug_from_name(path.name)
        ts = parse_timestamp(path.name)
        groups.setdefault(slug, []).append((ts, path))

    summaries: Dict[str, dict] = {}
    for slug, items in groups.items():
        summaries[slug] = summarize_group(items, tail=tail)
    return summaries


def print_report(slug: str, summary: dict):
    avg_perf = summary.get('avg_perf', 0.0)
    avg_lcp_ms = summary.get('avg_lcp_ms', 0.0)
    avg_fcp_ms = summary.get('avg_fcp_ms', 0.0)
    count = summary.get('count', 0)
    latest_path: Optional[Path] = summary.get('latest_path')

    lcp_display = f"{avg_lcp_ms/1000:.1f}s" if avg_lcp_ms else "N/A"
    fcp_display = f"{avg_fcp_ms/1000:.1f}s" if avg_fcp_ms else "N/A"

    print(f"\n{'='*70}")
    print(f"{slug} ({int(avg_perf*100)})")
    print(f"{'='*70}")
    print(f"Performance (avg last {count}): {int(avg_perf*100)}")
    print(f"LCP avg: {lcp_display}")
    print(f"FCP avg: {fcp_display}")

    if latest_path and latest_path.exists():
        report = json.loads(latest_path.read_text())
        lcp = report['audits']['largest-contentful-paint']
        fcp = report['audits']['first-contentful-paint']

        print(f"Latest sample (for details): {latest_path.name}")
        print(f"Latest LCP: {lcp['displayValue']} (score: {lcp['score']:.2f})")
        print(f"Latest FCP: {fcp['displayValue']} (score: {fcp['score']:.2f})")

        lcp_elem = report['audits'].get('largest-contentful-paint-element', {})
        if lcp_elem.get('details', {}).get('items'):
            elem = lcp_elem['details']['items'][0]
            snippet = elem.get('node', {}).get('snippet', 'N/A')
            print(f"LCP Element: {snippet[:100]}")

        print("\nTop Opportunities:")
        opps = [
            (k, v) for k, v in report['audits'].items()
            if v.get('details', {}).get('type') == 'opportunity' and v.get('score', 1) < 1
        ]
        opps.sort(key=lambda x: x[1].get('numericValue', 0), reverse=True)
        for key, audit in opps[:5]:
            savings = audit.get('numericValue', 0) / 1000
            print(f"  • {audit['title']}: {savings:.2f}s")
            items = audit.get('details', {}).get('items', [])[:3]
            for item in items:
                if 'url' in item:
                    url = item['url'].split('/')[-1][:50]
                    size = item.get('totalBytes', 0) / 1024
                    print(f"    - {url}: {size:.1f}KB")

        dom = report['audits'].get('dom-size', {})
        if dom.get('displayValue'):
            print(f"\n⚠️  DOM: {dom['displayValue']}")

        offscreen = report['audits'].get('offscreen-images', {})
        if offscreen.get('details', {}).get('items'):
            items = offscreen['details']['items']
            total_kb = sum(i.get('totalBytes', 0) for i in items) / 1024
            print(f"⚠️  Offscreen images: {len(items)} images ({total_kb:.1f}KB)")
            for item in items[:3]:
                url = item.get('url', '').split('/')[-1]
                print(f"    - {url}: {item.get('totalBytes',0)/1024:.1f}KB")
    else:
        print("No recent samples found to show details.")


def main():
    reports_dir = Path(__file__).parent.parent / 'lighthouse-reports'
    if not reports_dir.exists():
        raise SystemExit("reports directory not found")

    summaries = collect_latest_summaries(reports_dir, tail=10)
    if not summaries:
        raise SystemExit("no report files found")

    # Pick the 3 lowest performance scores among latest per slug
    scored = []
    for slug, summary in summaries.items():
        perf = summary.get('avg_perf', 0.0)
        scored.append((perf, slug, summary))

    scored.sort(key=lambda x: x[0])
    for perf, slug, summary in scored[:3]:
        print_report(slug, summary)


if __name__ == "__main__":
    main()
