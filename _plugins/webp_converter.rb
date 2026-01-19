# WebP Converter Plugin
# Automatically replaces .jpg, .jpeg, and .png references with .webp during Jekyll build

Jekyll::Hooks.register [:pages, :posts, :documents], :post_render do |doc|
  # Replace image extensions in rendered HTML and CSS outputs
  if [".html", ".css"].include?(doc.output_ext)
    # Match .jpg/.jpeg/.png before a quote, whitespace, closing paren, or query string start
    doc.output.gsub!(/\.(jpe?g|png)(?=["'\s\)\?])/i, '.webp')
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  puts "\n✨ WebP Converter: Replaced .jpg/.jpeg/.png references with .webp in HTML/CSS outputs"
end
