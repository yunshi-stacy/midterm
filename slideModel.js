//write triggers Here
map.on("load",function(){
  $('button#next').on('click', function(){
    clickNextButton();
    eachSlide();
  });
  $('button#prev').on('click', function(){
    clickPreviousButton();
    eachSlide();
  });
});
