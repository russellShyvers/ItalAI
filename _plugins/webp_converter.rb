# WebP Converter Plugin
# Automatically replaces .jpg, .jpeg, and .png references with .webp during Jekyll build
Jekyll::Hooks.register [:pages, :posts, :documents], :post_render do |doc|
  # Process HTML, CSS, JSON, and NDJSON files
  next unless [".html", ".css", ".json", ".ndjson"].include?(doc.output_ext)
  
  # Replace image extensions
  # Match .jpg/.jpeg/.png before a quote, whitespace, closing paren, query string, or end of string
  doc.output.gsub!(/\.(jpe?g|png)(?=["'\s\)\?]|$)/i, '.webp')
end

Jekyll::Hooks.register :site, :post_write do |site|
  puts "\n✨ WebP Converter: Replaced .jpg/.jpeg/.png references with .webp in outputs"
end