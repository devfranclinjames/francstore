// Find all items and add class to parent if text contains "cold"

setInterval(function(){
    var x = $('.classinit').attr('class');
    if (x === undefined){
    	//$( append script here).addClass('classinit');
        document.querySelectorAll('.item-name').forEach(item => {
        if (item.textContent.toLowerCase().includes('cold')) {
            item.closest('.item-btn')?.classList.add('skyblueme classinit');
        }
        });
    	console.log(x);
    }
    else {
        return;
    }
},500);
