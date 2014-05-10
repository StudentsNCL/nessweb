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
});
