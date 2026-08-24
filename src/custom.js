// Find all items and add class to parent if text contains "cold"

setInterval(function(){
    var x = $('.classinit').attr('class');
    if (x === undefined){
    	// Find all elements with class "item-name" that contain "cold" (case-insensitive)
            $('.item-name').filter(function() {
            return $(this).text().toLowerCase().includes('cold');
            }).each(function() {
            // Find the parent button with class "item-btn" and add the class
            $(this).closest('.item-btn').addClass('skyblueme');
            });
        
    	console.log(x);
    }
    else {
        return;
    }
},500);
