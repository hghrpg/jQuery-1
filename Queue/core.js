$(function() {


// var body = $('body');
// function cb1(next,hoost) {
//     console.log(11111)
//     next()  //执行了cb2 //22222
// }

// function cb2() {
//     console.log(22222)
// }

// //set
// $.queue(body, 'aa', cb1); // 第三个参数为function
// $.queue(body, 'aa', cb2); 

// $.dequeue(body, 'aa')  

   console.log( $("#aaron"))

    var div = $("div");

    function runIt() {


        div.show(1000);
        div.hide(2000);
        div.show(3000);
        // div.slideToggle("fast");

        return

        div.show("slow");
        div.animate({
            left: '+=300'
        }, 2000);
        div.slideToggle(1000);
        div.slideToggle("fast");
        div.animate({
            left: '-=200'
        }, 1500);
        div.hide("slow");
        div.show(1200);
        div.slideUp("normal", runIt);
    }

    function showIt() {
        var n = div.queue("fx");
        $("span").text(n.length);
        setTimeout(showIt, 100);
    }

    runIt();

    // showIt()



})