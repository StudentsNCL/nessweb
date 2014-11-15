$(function() {
    setTimeout(function()
    {
        $('.animated-bar').each(function()
        {
            this.style.width = $(this).attr('data-width') + '%';
        });

    }, 300);

    $('*[title]').tooltip();

    $('body').on('hidden.bs.modal', '.modal', function () {
        $(this).removeData('bs.modal');
    });

    if(typeof Dropzone !== 'undefined'){
        Dropzone.autoDiscover = false;
        var $submitButton = $('button[type="submit"]');
        var alreadyWarned = false;
        $submitButton.attr('disabled','disabled');
        var uniq = $('input[name="uniq"]').val();

        var maxFiles = $('#files').text();
        $("#upload").dropzone({
            url: "/coursework/submit/upload/" + uniq,
            autoProcessQueue: true,
            uploadMultiple: true,
            parallelUploads: 10,
            maxFiles: maxFiles,
            maxFilesize: $('#filesize').text(),
            addRemoveLinks: true,
            removedfile: function(file){
                $.ajax({
                    type: 'POST',
                    url: '/coursework/upload/delete/' + uniq,
                    data: {
                        file: file.name
                    }
                });

                var _ref;
                if (file.previewElement) {
                    if ((_ref = file.previewElement) != null) {
                        _ref.parentNode.removeChild(file.previewElement);
                    }
                }
                return this._updateMaxFilesReachedClass();
            },
            init: function() {
                var myDropzone = this;
                var dropzoneComplete = false;

                $('#submitForm').submit(function(e) {
                    var numFiles = myDropzone.getAcceptedFiles().length;
                    if(!alreadyWarned && numFiles < maxFiles) {
                        e.preventDefault();
                        alreadyWarned = true;
                        $('#numfiles').text(numFiles + ' file' + (numFiles != 1 ? 's' : ''));
                        $('#warnfiles').show();
                        $submitButton.text("Submit Anyway");
                    }
                    else {
                        $('.dropzone').removeClass('dz-clickable'); // remove cursor
                        //$('.dropzone')[0].removeEventListener('click', this.listeners[1].events.click);
                        $('input').attr('disabled', 'disabled');
                        $submitButton.attr('disabled','disabled');
                        $('.dz-remove').remove();
                        $submitButton.text("Submitting");
                    }
                });


                this.on("addedfile", function() {
                    $submitButton.removeAttr('disabled');
                });
            }
            // Accept only correct files?
            /*,accept: function(file, done) {
                if (file.type != "image/jpeg" || file.type != "image/png") {
                    done("Error! Files of this type are not accepted");
                }
                else {
                    done();
                }
            },*/
        });
    }
});
