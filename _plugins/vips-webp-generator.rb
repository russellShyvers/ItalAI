# Vips WebP generator
# Converts JPG and PNG under assets/images to WebP during Jekyll build using libvips.

module ItalAI
  class VipsWebpGenerator
    IMAGE_EXTS = %w[.jpg .jpeg .png].freeze
    MAX_WIDTH = 1600
    QUALITY = 82
    EFFORT = 4

    def self.run(site)
      require "vips"
    rescue LoadError => e
      warn "[vips-webp] ruby-vips not available: #{e.message}"
      return
    else
      image_dir = File.join(site.source, "assets", "images")
      return unless Dir.exist?(image_dir)

      Dir.glob(File.join(image_dir, "**", "*"), File::FNM_CASEFOLD).each do |path|
        next unless IMAGE_EXTS.include?(File.extname(path).downcase)

        webp_path = path.sub(/\.(jpe?g|png)\z/i, ".webp")
        next if File.exist?(webp_path) && File.mtime(webp_path) >= File.mtime(path)

        begin
          image = Vips::Image.new_from_file(path, access: :sequential)
          image = image.autorot if image.respond_to?(:autorot)
          image = image.thumbnail_image(MAX_WIDTH) if image.width > MAX_WIDTH
          image.webpsave(webp_path, Q: QUALITY, strip: true)
          puts "[vips-webp] #{File.basename(path)} -> #{File.basename(webp_path)}"
        rescue StandardError => e
          warn "[vips-webp] failed on #{path}: #{e.message}"
        end
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  ItalAI::VipsWebpGenerator.run(site)
end
