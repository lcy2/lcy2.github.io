var fieldSetActive = false; // is the file uploaded? or is there already a fieldSet awaiting acquisition?
var uploaded = false;
var img_scale = 1; // actual size / constrained size

$.fn.hasExtension = function(exts) {
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test($(this).val());
}

function displayUploadFile(input, canvas) {
  // when a new file is being prepped for upload
  // clean up everything
  $('fieldset').removeClass('bg-success');
  $('input[type="number"]').val("");
  fieldSetActive = false;
  uploaded = false;

  // check if the extension is correct
    if (!input.hasExtension(['.jpg', '.jpeg'])) {
      input.addClass('is-invalid');
      canvas.attr('src', "//:0");
      canvas.height(0);
      return;
    }


  // input is an input=file element
    if (input.prop('files') && input.prop('files')[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            canvas.height('auto');
            canvas.attr('src', e.target.result).on('load', function(){
              img_scale = canvas[0].naturalWidth / canvas.width();
            });
           fieldSetActive = true;
            uploaded = true;

            // return fieldsets back into the initial states
            input.removeClass('is-invalid');
        }
        reader.readAsDataURL(input.prop('files')[0]);
    }
}

jQuery(function() {

  $('input[name="img_file"]').change(function(){
    displayUploadFile($(this), $("#PET_img"));
  });


  $('fieldset').click(function(){
    if (fieldSetActive && uploaded){
      fieldName = $(this).children('legend').first().text().trim().split(' ')[0];
      $(this).removeClass('bg-light');
      $(this).removeClass('bg-success');
      $(this).addClass('bg-warning');
      fieldSetActive = false;
    }
  });

  $('fieldset').hover(function(){
    if (fieldSetActive && uploaded && !$(this).hasClass('bg-success')){
      $(this).addClass('bg-light');
    }
  }, function(){
    if (fieldSetActive && uploaded){
      $(this).removeClass('bg-light');
    }
  });

  // set the click handler: click on the image to get x and y
  $('#PET_img').click(function(event){
    if (!fieldSetActive && uploaded){
      var $input_fields = $('.bg-warning input[type="number"]');
      $input_fields.eq(0).val(Math.round((event.pageX - $(this).offset().left) * img_scale));
      $input_fields.eq(1).val(Math.round((event.pageY - $(this).offset().top) * img_scale));
      // clean up
      fieldSetActive = true;
      $('.bg-warning').addClass('bg-success');
      $('.bg-warning').removeClass('bg-warning');
    }
  });


  // convert all disabled elements to readonly
  //$('input[type="submit"]').click(function(){
  //  $('input[type="number"]').prop('disabled', false);
  //});


  $('input[type="reset"]').click(function(){
    $('fieldset').removeClass('bg-success');
  });

  // disable custom entries into the number fields
  $('.input-group input[type="number"]').keydown(function(e){
    e.preventDefault();
  });
});
