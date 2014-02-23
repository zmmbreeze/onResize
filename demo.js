onResize(document.getElementsByTagName('img')[0])
    .then(function (v, oldV) {
        console.log('oldValue:' + oldV.width + 'x' + oldV.height);
        console.log('newValue:' + v.width + 'x' + v.height);
    });
