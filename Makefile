all: static server

static:
	gulp

server:
	node server

watch:
	gulp && gulp watch


.PHONY: all static server watch