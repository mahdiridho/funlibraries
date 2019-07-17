import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import "@polymer/paper-styles/color.js";

/**
 * `circular-slider`
 * A Material Design slider on circular mode
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class CircularSlider extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;
          --range-font-size: 12px;
          --linear-gradient1: 90deg;
          --linear-gradient2: -22.5deg;
          --linear-gradient3: 22.5deg;
          --linear-gradient4: -90deg;
          --background-position: 0 0em;
          --circular-color: var(--paper-green-400);
        }

        input[type='range'][orient='circular'] {
          height: 3em;
          width: 3em;
          line-height: 3em;
          display: inline-block;
          background-color: currentColor;
          transform-origin: 50% 50%;
          border-radius: 50%;
          box-shadow: inset 0 0 0 0.09em currentColor;
          box-sizing: border-box;
          transform-origin: 50% 50%;
          transform: rotate(-45deg);
        }
        input[type='range'][orient='circular'], input[type='range'][orient='circular']::before, input[type='range'][orient='circular']::after, input[type='range'][orient='circular'] /deep/ *, input[type='range'][orient='circular'] /deep/ *::before, input[type='range'][orient='circular'] /deep/ *::after {
          box-sizing: border-box;
        }
        input[type='range'][orient='circular'] /deep/ * {
          position: relative;
        }
        input[type='range'][orient='circular']:not(*:root) {
          font-size: var(--range-font-size);
        }
        input[type='range'][orient='circular']:not(*:root) {
          -webkit-appearance: none;
        }
        input[type='range'][orient='circular']:not(*:root):focus {
          outline: none;
        }
        input[type='range'][orient='circular']::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          position: relative;
          z-index: 1;
        }
        input[type='range'][orient='circular']::-webkit-slider-runnable-track::after {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: inherit;
          height: inherit;
          border-radius: inherit;
          z-index: -1;
        }
        input[type='range'][orient='circular']::-webkit-slider-thumb {
          -webkit-appearance: none;
          position: relative;
          text-align: center;
        }
        input[type='range'][orient='circular']::-webkit-slider-thumb::before {
          position: absolute;
          transform: translate(-100%, -50%);
          display: block;
          z-index: -1;
          left: 0;
          top: 50%;
        }
        input[type='range'][orient='circular']:hover, input[type='range'][orient='circular']:active, input[type='range'][orient='circular']:focus:hover, input[type='range'][orient='circular']:focus:active {
          box-shadow: 0 0 0 0.09em white, 0 0 0 0.3em currentColor, inset 0 0 0 0.09em currentColor;
        }
        input[type='range'][orient='circular']:focus {
          box-shadow: 0 0 0 0.09em white, 0 0 0 0.18em currentColor, inset 0 0 0 0.09em currentColor;
        }
        input[type='range'][orient='circular'] {
          background-image: radial-gradient(currentColor 33%, rgba(0, 0, 0, 0) 34%), linear-gradient(var(--linear-gradient1), transparent 50%, white 50%), linear-gradient(var(--linear-gradient2), white 50%, transparent 50%), linear-gradient(var(--linear-gradient3), transparent 50%, white 50%), linear-gradient(var(--linear-gradient4), white 50%, transparent 50%), radial-gradient(#ffffff 49%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 64%, #ffffff 65%);
          color: var(--circular-color);
        }
        input[type='range'][orient='circular']::-webkit-slider-thumb {
          border: 0;
          height: 1em;
          width: 1em;
          background: transparent;
        }

        .vertical {
          @apply --layout-vertical;
          @apply --layout-center;
          float: left;
          height: var(--box-height);
          margin-right: var(--slide-right-margin);
          margin-left: var(--slide-left-margin);
        }

        .circularRange {
          margin-right: 10px;
          margin-left: 10px;
        }

        .textTitle > p {
          font-size: 10px;
          text-align: center;
          white-space: pre-line;
        }
      </style>

      <div class="vertical">
        <div class="circularRange">
          <input type="range" orient='circular' min="0" max="{{max}}" value="{{scaleValue::input}}" step="1" />
        </div>
        <div class="inputRange">
          <input type="number" min="0" max={{maxValue}} step={{stepValue}} value="{{circularValue::input}}" />
        </div>
        <div class="textTitle">
          <p>{{circularTitle}}</p>
        </div>
      </div>
    `;
  }
  static get properties() {
    return {
      circularTitle: {type: String, value: "Circular"},
      circularSize: {type: Number, value: 12},
      circularValue: {type: Number, value: 0},
      scaleValue: {type: Number, value: 0},
      circularColor: {type: String, value: "var(--paper-green-400)"},
      max: {type: Number, value: 12},
      maxValue: {type: Number, value: 12},
      stepValue: {type: Number, value: 1},
      stepDeg: {type: Number, value: 22.5},
    }
  }

  connectedCallback(){
    super.connectedCallback();
    let elem1 = this.shadowRoot.querySelector("input[type='range']"), 
        elem2 = this.shadowRoot.querySelector("input[type='number']");
    this.max=this.maxValue/this.stepValue;
    this.stepDeg=270/this.max;
    this.updateStyles({
      '--range-font-size': Number(this.circularSize)+"px",
      '--circular-color': this.circularColor,
      '--linear-gradient1': Number(90)+"deg",
      '--linear-gradient2': Number(-this.stepDeg)+"deg",
      '--linear-gradient3': Number(this.stepDeg)+"deg",
      '--linear-gradient4': Number(-90)+"deg",
    });
    elem1.addEventListener('input', (e)=>{
      console.log(e.target.value);
      e.target.setAttribute('value', e.target.value);
      this.circularValue=e.target.value*this.stepValue;
      this.updateStyles({
        '--linear-gradient1': Number(90+this.stepDeg*e.target.value)+"deg",
        '--linear-gradient2': Number(-this.stepDeg+this.stepDeg*e.target.value)+"deg",
        '--linear-gradient3': Number(this.stepDeg+this.stepDeg*e.target.value)+"deg",
        '--linear-gradient4': Number(-90+this.stepDeg*e.target.value)+"deg",
        '--background-position': '0 '+Number(0+-3*e.target.value)+'em'
      });
      this.dispatchEvent(new CustomEvent('change',{detail:{title:this.circularTitle,value:this.circularValue}}));
    }, false);
    elem2.addEventListener('input', (e)=>{
      console.log(e.target.value);
      this.scaleValue=e.target.value/this.stepValue;
      this.updateStyles({
        '--linear-gradient1': Number(90+this.stepDeg*this.scaleValue)+"deg",
        '--linear-gradient2': Number(-this.stepDeg+this.stepDeg*this.scaleValue)+"deg",
        '--linear-gradient3': Number(this.stepDeg+this.stepDeg*this.scaleValue)+"deg",
        '--linear-gradient4': Number(-90+this.stepDeg*this.scaleValue)+"deg",
        '--background-position': '0 '+Number(0+-3*this.scaleValue)+'em'
      });
      this.dispatchEvent(new CustomEvent('change',{detail:{title:this.circularTitle,value:this.circularValue}}));
    }, false);
  }

  _setFirst(){
    this.updateStyles({
      '--linear-gradient1': Number(90+this.stepDeg*this.scaleValue)+"deg",
      '--linear-gradient2': Number(-this.stepDeg+this.stepDeg*this.scaleValue)+"deg",
      '--linear-gradient3': Number(this.stepDeg+this.stepDeg*this.scaleValue)+"deg",
      '--linear-gradient4': Number(-90+this.stepDeg*this.scaleValue)+"deg",
      '--background-position': '0 '+Number(0+-3*this.scaleValue)+'em'
    });
  }
}

window.customElements.define('circular-slider', CircularSlider);
