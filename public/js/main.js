
$(function()
{
    setTimeout(function()
    {
        $('.animated-bar').each(function()
        {
            this.style.width = $(this).attr('data-width') + '%';
        });
    }, 300);
});
