
var calendar = $("#calendar").calendar(
    {
        tmpl_path: "/tmpls/",
        events_source: '/json/calendar',
        onAfterEventsLoad: function(events) {
			if(!events) {
				return;
			}
			var list = $('#eventlist');
			list.html('');

			$.each(events, function(key, val) {
				$(document.createElement('li'))
					.html('<a href="' + val.url + '">' + val.title + '</a>')
					.appendTo(list);
			});
		},
		onAfterViewLoad: function(view) {
			$('.page-header h3').text(this.getTitle());
			$('.btn-group button').removeClass('active');
			$('button[data-calendar-view="' + view + '"]').addClass('active');
		}
    });

$('.btn-group button[data-calendar-nav]').each(function() {
	var $this = $(this);
	$this.click(function() {
		calendar.navigate($this.data('calendar-nav'));
	});
});

$('.btn-group button[data-calendar-view]').each(function() {
	var $this = $(this);
	$this.click(function() {
		calendar.view($this.data('calendar-view'));
	});
});
