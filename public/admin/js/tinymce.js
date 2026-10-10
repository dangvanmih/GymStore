tinymce.init({
  selector: 'textarea',
  content_css: '/admin/css/tinymce.css',
  license_key: 'gpl',
  plugins: 'lists link image table code help wordcount',

  content_style: ` 
  body { background-color: #0b0d14; color: #ffffff;font-family: Arial, sans-serif; font-size: 14px; padding: 12px; }
   p { color: #FFFF; } 
   a { color: #818cf8; } 
   h1, h2, h3, h4, h5, h6 { color: #ffffff; } 
   blockquote { border-left: 3px solid #4f46e5; 
   padding-left: 12px; color: #94a3b8; } 
   code, pre { background-color: #121520; color: #a5b4fc; } `


});