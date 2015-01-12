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
                        $submitButton.attr('disabled','disabled');
                        $('.dz-remove').remove();
                        $submitButton.text("Submitting");
                    }
                });

                this.on("sending", function() {
                    $submitButton.attr('disabled', 'disabled');
                });

                this.on("success", function() {
                    $submitButton.removeAttr('disabled');
                });
            },
            accept: function(file, done) {
                if(this.files.length > 1){
                    for(var i = 0; i < this.files.length - 1; i++){
                        if(this.files[i].name === file.name){
                            // Don't reupload file that exists
                            var newFile = this.files[this.files.length - 1];
                            newFile.previewElement.parentNode.removeChild(newFile.previewElement);
                            this.files.pop();
                            return done("Error! This file has already been uploaded");
                        }
                    }
                    return done();
                }
                // Accept only correct files?
                /*if (file.type != "image/jpeg" || file.type != "image/png") {
                    done("Error! Files of this type are not accepted");
                }*/
                else {
                    return done();
                }
            },
        });
    }

    var doneInterval = 700,
    $sliders = $('.slider'),
    nessPersistOn = $sliders.closest('table').attr('data-nesspersist');

    $('.slider').each(function(key, val){
        $(this).slider().on('slide slideStop', function(slider) {
            $this = $(this);
            $this.parent().find('.mark').text(slider.value);
            updateTotal();
            if (!nessPersistOn) {
                return;
            }
            var timer = $(this).data(slider.target.id);
            if(timer)
                clearTimeout(timer);
            var newTime = setTimeout(function(){
                $tr = $this.closest('tr');
                postChanges($tr.find('.coursework').text(), slider.value, $tr.find('.percentage').text());
            }, doneInterval);
            $this.data(slider.target.id, newTime);
        });
    });

    function postChanges(coursework, mark, percent){
        $.ajax({
            method: 'POST',
            url: '/ajax/mark',
            data: {
                module: $('.breadcrumb .active').text(),
                coursework: coursework,
                mark: mark,
                percent: percent
            }
        });
    }

    updateTotal();

    function updateTotal(){
        if($('#totalProgress').length == 0)
            return;
        var total = 0;
        $('.mark').each(function(){
            total += parseInt($(this).text()) * parseInt($(this).closest('tr').find('.percentage').text()) / 100;
        });
        var newClass = total >= 70 ? 'success' : total >= 40 ? 'warning' : 'danger';
        $('#totalProgress')[0].className = $('#totalProgress')[0].className.replace(/(progress-bar-)[a-z]+/, '$1' + newClass);
        $('#total').text(Math.round(total * 10) / 10);
        $('#totalProgress').width(total + '%');
    }

    $('.mark-select button').click(function() {
        var button = $(this)[0].dataset.selected;
        $('.incomplete').each(function() {
            var value = $(this).data(button);
            var newClass = button == 'min' ? 'danger' : button == 'max' ? 'success' : 'info';
            $(this)[0].className = $(this)[0].className.replace(/(progress-bar-)[a-z]+/, '$1' + newClass);
            $(this).width(value + '%').text(value + '%');
        })
    })
});
