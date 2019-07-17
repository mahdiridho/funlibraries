import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `v-paper-slider`
 * A Material Design slider on vertical mode
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class VPaperSlider extends PolymerElement {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
        --slide-background: #3071a9;
        --slide-right-margin: 0;
        --slide-left-margin: 0;
        --slide-size: 200px;
        --box-height: 270px;
      }

      .vertical {
        @apply --layout-vertical;
        @apply --layout-center;
        float: left;
        height: var(--box-height);
        margin-right: var(--slide-right-margin);
        margin-left: var(--slide-left-margin);
      }

      input[type=number] {
        font-size:10px;width:35px;
      }

      .sliderRange {
        transform: rotate(-90deg);
        margin-top: 100px;
        margin-right: -100px;
        margin-bottom: 90px;
        margin-left: -105px;
        width: var(--slide-size);
      }

      input[type=range] {
        -webkit-appearance: none;
        width: var(--slide-size);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        background-color: #fff;
        border: 1px solid #ccc;
        margin-top: -8px;
        width: 20px;
        height: 20px;
        border-radius: 10px;
        cursor: pointer;
      }
      input[type=range]::-webkit-slider-runnable-track {
        height: 4px;
        background: var(--slide-background);
      }
      input[type=range]:focus {
        outline: none;
      }

      .textTitle > p {
        font-size: 10px;
        text-align: center;
        white-space: pre-line;
      }
    </style>

    <div class="vertical">
      <div class="inputRange">
        <input on-change="_changeInput" type="number" min={{sliderMin}} max={{sliderMax}} step={{sliderStep}} value="{{sliderValue::input}}" />
      </div>
      <div class="sliderRange">
        <input orient="vertical" on-change="_changeDrag" id="{{sliderTitle}}-{{sliderId}}" type="range" min={{sliderMinDrag}} max={{sliderMaxDrag}} step={{sliderStep}} value="{{sliderValueDrag::input}}" />
      </div>
      <div class="textTitle">
        <p style="color: blue;">{{sliderValue}} dB</p>
        <p>{{sliderTitle}}</p>
      </div>
    </div>
    `;
  }

  static get properties() {
    return {
      sWidth: {type: String, value: null},
      sRight: {type: String, value: null},
      sLeft: {type: String, value: null},
      sBackgroundColor: {type: String, value: null},
      sliderValue: {type: Number, value:20.25},
      sliderTitle: {type: String, value: "Slider"},
      sliderId: {type: Number, value: 0},
      sliderMin: {type: Number, value: 0},
      sliderMax: {type: Number, value: 100},
      sliderStep: {type: Number, value: 0.25},
      // True if sliderMin is positif value, False if sliderMin is negatif value
      sliderStyle: {type: Boolean, value: true},
      sliderValueOri: {type: Number, value:20.25},
      sliderMinOri: {type: Number, value: 0},
      sliderMaxOri: {type: Number, value: 0}
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.sliderMinDrag = this.sliderMin;
    this.sliderMaxDrag = this.sliderMax;
    this.sliderValueDrag = this.sliderValue;
    if(this.sliderMin < 0){
      this.sliderStyle = false;
      this.sliderMaxDrag = this.sliderMax - this.sliderMin;
      this.sliderMinDrag = 0;
      this.sliderValueDrag = this.sliderValue - this.sliderMin;
    }
    this.updateStyles({
      '--slide-background': this.sBackgroundColor,
      '--slide-right-margin': this.sRight+"px",
      '--slide-left-margin': this.sLeft+"px",
      '--slide-size': this.sWidth+"px",
      '--box-height': Number(this.sWidth)+110+"px"
    });
  }

  _changeDrag(e){
    console.log(this.sliderMinDrag);
    console.log(this.sliderValueDrag);
    console.log(this.sliderValue);
    if(!this.sliderStyle){
      this.sliderValue = (Number(this.sliderMin) + Number(this.sliderValueDrag)).toFixed(2);
    }else{
      this.sliderValue = Number(this.sliderValueDrag).toFixed(2);
    }
    console.log(this.sliderValue);
    let sliderObj = this.shadowRoot.querySelector(".sliderRange input").id.split("-");
    console.log(sliderObj);
    this.dispatchEvent(new CustomEvent('change',{detail:{sliderObj:sliderObj,value:this.sliderValue}}));
  }

  _changeInput(e){
    console.log(this.sliderMin);
    console.log(this.sliderMax);
    console.log(this.sliderValue);
    if(!this.sliderStyle){
      this.sliderValueDrag = Number(this.sliderValue) - Number(this.sliderMin);
    }else{
      this.sliderValueDrag = Number(this.sliderValue);
    }
    console.log(this.sliderValueDrag);
    let sliderObj = this.shadowRoot.querySelector(".sliderRange input").id.split("-");
    console.log(sliderObj);
    this.dispatchEvent(new CustomEvent('change',{detail:{sliderObj:sliderObj,value:this.sliderValue}}));
  }
}

window.customElements.define('v-paper-slider', VPaperSlider);
