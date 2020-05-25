$(window).load(function(){
	
	// We are listening to the window.load event, so we can be sure
	// that the images in the slideshow are loaded properly.


	// Testing wether the current browser supports the canvas element:
	var supportCanvas = 'getContext' in document.createElement('canvas');

	// The canvas manipulations of the images are CPU intensive,
	// this is why we are using setTimeout to make them asynchronous
	// and improve the responsiveness of the page.
	
	

	var slides = $('.slideshow li'),
		current = 0,
		slideshow = {width:0,height:0};

	setTimeout(function(){
		
		window.console && window.console.time && console.time('Generated In');
		
		if(supportCanvas){
			$('.slideshow img').each(function(){

				if(!slideshow.width){
					// Taking the dimensions of the first image:
					slideshow.width = this.width;
					slideshow.height = this.height;
				}
				
				// Rendering the modified versions of the images:
				createCanvasOverlay(this);
			});
		}
		
		window.console && window.console.timeEnd && console.timeEnd('Generated In');
		
		$('.slideshow .arrow').click(function(){
			var li			= slides.eq(current),
				canvas		= li.find('canvas'),
				nextIndex	= 0;

			// Depending on whether this is the next or previous
			// arrow, calculate the index of the next slide accordingly.
			
			if($(this).hasClass('next')){
				nextIndex = current >= slides.length-1 ? 0 : current+1;
			}
			else {
				nextIndex = current <= 0 ? slides.length-1 : current-1;
			}

			var next = slides.eq(nextIndex);
			
			if(supportCanvas){

				// This browser supports canvas, fade it into view:

				canvas.fadeIn(function(){
					
					// Show the next slide below the current one:
					next.show();
					current = nextIndex;
					
					// Fade the current slide out of view:
					li.fadeOut(function(){
						li.removeClass('slideActive');
						canvas.hide();
						next.addClass('slideActive');
					});
				});
			}
			else {
				
				// This browser does not support canvas.
				// Use the plain version of the slideshow.
				
				current=nextIndex;
				next.addClass('slideActive').show();
				li.removeClass('slideActive').hide();
			}
		});
		
	},100);

	// This function takes an image and renders
	// a version of it similar to the Overlay blending
	// mode in Photoshop.
	
	function createCanvasOverlay(image){

		var canvas			= document.createElement('canvas'),
			canvasContext	= canvas.getContext("2d");
		
		// Make it the same size as the image
		canvas.width = slideshow.width;
		canvas.height = slideshow.height;
		
		// Drawing the default version of the image on the canvas:
		canvasContext.drawImage(image,0,0);
		

		// Taking the image data and storing it in the imageData array:
		var imageData	= canvasContext.getImageData(0,0,canvas.width,canvas.height),
			data		= imageData.data;
		
		// Loop through all the pixels in the imageData array, and modify
		// the red, green, and blue color values.
		
		for(var i = 0,z=data.length;i<z;i++){
			
			// The values for red, green and blue are consecutive elements
			// in the imageData array. We modify the three of them at once:
			
			data[i] = ((data[i] < 128) ? (2*data[i]*data[i] / 255) : (255 - 2 * (255 - data[i]) * (255 - data[i]) / 255));
			data[++i] = ((data[i] < 128) ? (2*data[i]*data[i] / 255) : (255 - 2 * (255 - data[i]) * (255 - data[i]) / 255));
			data[++i] = ((data[i] < 128) ? (2*data[i]*data[i] / 255) : (255 - 2 * (255 - data[i]) * (255 - data[i]) / 255));
			
			// After the RGB elements is the alpha value, but we leave it the same.
			++i;
		}
		
		// Putting the modified imageData back to the canvas.
		canvasContext.putImageData(imageData,0,0);
		
		// Inserting the canvas in the DOM, before the image:
		image.parentNode.insertBefore(canvas,image);
	}

	
});
(function() {
	// get all data in form and return object
	function getFormData(form) {
	  var elements = form.elements;
	  var honeypot;
  
	  var fields = Object.keys(elements).filter(function(k) {
		if (elements[k].name === "honeypot") {
		  honeypot = elements[k].value;
		  return false;
		}
		return true;
	  }).map(function(k) {
		if(elements[k].name !== undefined) {
		  return elements[k].name;
		// special case for Edge's html collection
		}else if(elements[k].length > 0){
		  return elements[k].item(0).name;
		}
	  }).filter(function(item, pos, self) {
		return self.indexOf(item) == pos && item;
	  });
  
	  var formData = {};
	  fields.forEach(function(name){
		var element = elements[name];
		
		// singular form elements just have one value
		formData[name] = element.value;
  
		// when our element has multiple items, get their values
		if (element.length) {
		  var data = [];
		  for (var i = 0; i < element.length; i++) {
			var item = element.item(i);
			if (item.checked || item.selected) {
			  data.push(item.value);
			}
		  }
		  formData[name] = data.join(', ');
		}
	  });
  
	  // add form-specific values into the data
	  formData.formDataNameOrder = JSON.stringify(fields);
	  formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
	  formData.formGoogleSendEmail
		= form.dataset.email || ""; // no email by default
  
	  return {data: formData, honeypot: honeypot};
	}
  
	function handleFormSubmit(event) {  // handles form submit without any jquery
	  event.preventDefault();           // we are submitting via xhr below
	  var form = event.target;
	  var formData = getFormData(form);
	  var data = formData.data;
  
	  // If a honeypot field is filled, assume it was done so by a spam bot.
	  if (formData.honeypot) {
		return false;
	  }
  
	  disableAllButtons(form);
	  var url = form.action;
	  var xhr = new XMLHttpRequest();
	  xhr.open('POST', url);
	  // xhr.withCredentials = true;
	  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	  xhr.onreadystatechange = function() {
		  if (xhr.readyState === 4 && xhr.status === 200) {
			form.reset();
			var formElements = form.querySelector(".form-elements")
			if (formElements) {
			  formElements.style.display = "none"; // hide form
			}
			var thankYouMessage = form.querySelector(".thankyou_message");
			if (thankYouMessage) {
			  thankYouMessage.style.display = "block";
			}
		  }
	  };
	  // url encode form data for sending as post data
	  var encoded = Object.keys(data).map(function(k) {
		  return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
	  }).join('&');
	  xhr.send(encoded);
	}
	
	function loaded() {
	  // bind to the submit event of our form
	  var forms = document.querySelectorAll("form.gform");
	  for (var i = 0; i < forms.length; i++) {
		forms[i].addEventListener("submit", handleFormSubmit, false);
	  }
	};
	document.addEventListener("DOMContentLoaded", loaded, false);
  
	function disableAllButtons(form) {
	  var buttons = form.querySelectorAll("button");
	  for (var i = 0; i < buttons.length; i++) {
		buttons[i].disabled = true;
	  }
	}
  })();
  
 
