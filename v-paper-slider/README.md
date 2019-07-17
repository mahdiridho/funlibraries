# \<v-paper-slider\>

A Material Design slider on vertical mode

## Installation

npm i @mahdiridho/v-paper-slider

## How to use it

<v-paper-slider 
	s-width="SLIDER_SIZE" 
	s-right="SLIDER_RIGHT_MARGIN" 
	s-left="SLIDER_LEFT_MARGIN" 
	s-background-color="SLIDER_BACKGROUND_COLOR" 
	slider-value="SLIDER_DEFAULT_VALUE" 
	slider-min="SLIDER_MINIMUM_VALUE" 
	slider-max="SLIDER_MAXIMUM_VALUE" 
	slider-step="SLIDER_STEP_VALUE">
</v-paper-slider>

## Properties

s-width : Slider size in pixel
s-right : Slider right margin in pixel
s-left : Slider left margin in pixel
s-background-color : Slider background color (i.e #ff00aa || blue)
slider-value : Default value of the slider can be integer or float (i.e 25 || 63.225)
slider-min : Minimal value of the Slider can be integer or float (i.e 25 || 10.5)
slider-max : Maximal value of the Slider can be integer or float (i.e 80 || 70.5)
slider-step : Step value of the Slider can be integer or float (i.e 1 || 1.2)