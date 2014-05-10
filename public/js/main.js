
$(function()
{
    setTimeout(function()
    {
        $('.attendance-bar').each(function()
        {
            this.style.width = $(this).attr('data-width') + '%';
        });
    }, 300);
});
