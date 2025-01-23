/* eslint-disable */
const { merge } = window._;

/*-----------------------------------------------
|   Dropzone
-----------------------------------------------*/

window.Dropzone ? (window.Dropzone.autoDiscover = false) : '';

const dropzoneInit = () => {
  const { getData } = window.phoenix.utils;
  const Selector = {
    DROPZONE: '[data-dropzone]',
    DZ_ERROR_MESSAGE: '.dz-error-message',
    DZ_PREVIEW: '.dz-preview',
    DZ_PROGRESS: '.dz-preview .dz-preview-cover .dz-progress',
    DZ_PREVIEW_COVER: '.dz-preview .dz-preview-cover'
  };

  const ClassName = {
    DZ_FILE_PROCESSING: 'dz-file-processing',
    DZ_FILE_COMPLETE: 'dz-file-complete',
    DZ_COMPLETE: 'dz-complete',
    DZ_PROCESSING: 'dz-processing'
  };

  const DATA_KEY = {
    OPTIONS: 'options'
  };

  const Events = {
    ADDED_FILE: 'addedfile',
    REMOVED_FILE: 'removedfile',
    COMPLETE: 'complete'
  };

  const dropzones = document.querySelectorAll(Selector.DROPZONE);

  !!dropzones.length &&
    dropzones.forEach(item => {
      let userOptions = getData(item, DATA_KEY.OPTIONS);
      userOptions = userOptions ? userOptions : {};
      const data = userOptions.data ? userOptions.data : {};

      // Special handling for product images dropzone
      if (item.id === 'product-images') {
        const productDropzoneOptions = {
          url: '/api/v1/products',
          paramName: 'images',
          maxFilesize: 5,
          maxFiles: 5,
          acceptedFiles: 'image/*',
          addRemoveLinks: true,
          thumbnailWidth: 80,
          thumbnailHeight: 80,
          autoProcessQueue: true,
          uploadMultiple: true,
          init: function() {
            this.on(Events.ADDED_FILE, function(file) {
              console.log("File added:", file.name);
            });

            this.on('success', function(file, response) {
              console.log("File uploaded successfully:", file.name);
              console.log("Server response:", response);
              
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'uploadedImages[]';
              input.value = file.name;
              document.querySelector('form').appendChild(input);
            });

            this.on('error', function(file, errorMessage) {
              console.error("Upload error for file", file.name, ":", errorMessage);
            });

            this.on(Events.REMOVED_FILE, function(file) {
              console.log("File removed:", file.name);
              const input = document.querySelector(`input[value="${file.name}"]`);
              if (input) input.remove();
            });

            this.on(Events.COMPLETE, function() {
              if (item.querySelector(Selector.DZ_PREVIEW_COVER)) {
                item
                  .querySelector(Selector.DZ_PREVIEW_COVER)
                  .classList.remove(ClassName.DZ_PROCESSING);
              }
              item.classList.add(ClassName.DZ_FILE_COMPLETE);
            });
          }
        };
        
        // Initialize product dropzone with merged options
        new window.Dropzone(item, merge(productDropzoneOptions, userOptions));
        return; // Skip the rest of the code for this item
      }

      // Default dropzone options for other dropzones
      const options = merge(
        {
          url: '/assets/php/',
          addRemoveLinks: false,
          previewsContainer: item.querySelector(Selector.DZ_PREVIEW),
          previewTemplate: item.querySelector(Selector.DZ_PREVIEW).innerHTML,
          thumbnailWidth: null,
          thumbnailHeight: null,
          maxFilesize: 2,
          autoProcessQueue: false,
          filesizeBase: 1000,
          init: function init() {
            const thisDropzone = this;

            if (data.length) {
              data.forEach(v => {
                const mockFile = { name: v.name, size: v.size };
                thisDropzone.options.addedfile.call(thisDropzone, mockFile);
                thisDropzone.options.thumbnail.call(
                  thisDropzone,
                  mockFile,
                  `${v.url}/${v.name}`
                );
              });
            }

            thisDropzone.on(Events.ADDED_FILE, function addedfile() {
              if ('maxFiles' in userOptions) {
                if (
                  userOptions.maxFiles === 1 &&
                  item.querySelectorAll(Selector.DZ_PREVIEW_COVER).length > 1
                ) {
                  item.querySelector(Selector.DZ_PREVIEW_COVER).remove();
                }
                if (userOptions.maxFiles === 1 && this.files.length > 1) {
                  this.removeFile(this.files[0]);
                }
              }
            });
          }
        },
        userOptions
      );

      // Initialize regular dropzone
      item.querySelector(Selector.DZ_PREVIEW).innerHTML = '';
      new window.Dropzone(item, options);
    });
};

export default dropzoneInit;
