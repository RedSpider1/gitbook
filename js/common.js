hljs.initHighlightingOnLoad();

var codeSpace = new RegExp( '    ' , "g" )

$(document).ready(function(){
    setTimeout(() => {
        $('code.hljs').each(function(){
            var codestr = $(this).html();
            $(this).html(codestr.replace(/\n/g, '<br>'));
        });
    }, 3000);
});

$(document).ready(function(){
    setTimeout(() => {
        $('code.hljs').each(function(){
            var codestr = $(this).html();
            $(this).html(codestr.replace(codeSpace, '  '));
        });
    }, 10000);
});