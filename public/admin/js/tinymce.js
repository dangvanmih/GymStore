tinymce.init({
  selector: 'textarea',
  license_key: 'gpl',
  plugins: 'lists link image table code help wordcount',
    file_picker_types: 'image',
  /* and here's our custom image picker*/
  file_picker_callback: (cb, value, meta) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const id = 'blobid' + (new Date()).getTime();
        const blobCache =  tinymce.activeEditor.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        cb(blobInfo.blobUri(), { title: file.name });
      });
      reader.readAsDataURL(file);
    });

    input.click();
  },
  content_style: ` 
  body { background-color: #ffff;font-family: Arial, sans-serif; font-size: 14px; }
   p { color: #3A3541; } 
   a { color: #818cf8; } 
   h1, h2, h3, h4, h5, h6 { color: #ffffff; } 
   blockquote { border-left: 3px solid #4f46e5; 
   padding-left: 12px; color: #94a3b8; } 
   code, pre { background-color: #121520; color: #a5b4fc; } `
});