hljs.initHighlightingOnLoad();
setTimeout(() => {
    $('code.hljs').each(function(){
        var codestr = $(this).html();
        $(this).html(codestr.replace(/\n/g, '<br>'));
    });
}, 3000);