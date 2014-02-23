$(window).load(function () {
    $('.test').each(function (i, div) {
        div = $(div);
        var span = div.prev().find('span');
        var e = div.children().eq(0);
        span.text(e.width() + 'x' + e.height());
        onResize(e[0])
            .then(function (v) {
                span.text(v.width + 'x' + v.height);
            });

        if (e[0].nodeName.toLowerCase() === 'img') {
            e.next()
                .click(function (e) {
                    var img = $(e.target).prev();
                    img.width(img.width() === 600 ? 300 : 600);
                });
        }
    });
});
