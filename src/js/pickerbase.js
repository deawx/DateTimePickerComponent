/**
 * @module js/pickerbase
 * @author Marcello Surdi
 * @version 1.0.0
 *
 * @desc
 * This module contains the PickerBase class that serves as a base for Date*Picker classes.
 */

// IE11 backcompatibility notes
// Polyfill for Element.prototype.matches
 if( !Element.prototype.matches ) {
   Element.prototype.matches =
     Element.prototype.matchesSelector ||
     Element.prototype.mozMatchesSelector ||
     Element.prototype.msMatchesSelector ||
     Element.prototype.oMatchesSelector ||
     Element.prototype.webkitMatchesSelector
 }
// Please note, the following code will be transpiled with WebPack/Babel for IE11 backcompatibility.
// If you want to use destructuring assignment too, you also need to install @babel/polyfill.
// Somewhere, in the code below, you can find the alternative syntax commented.




/**
 * @class
 *
 * @classdesc
 * It's the base class for Date*Picker classes. Objects of this class are **never** created.
 *
 * @todo Provide support to disable days and hours even if these are between first_date and last_date
 * @todo Provide support for touch events
 * @todo Provide a year picker similar to a HTML native select control
 */
export function PickerBase() {
  /**
   * @property {object} i18n Strings for translation
   */
  this.i18n = {
    'jan':'jan',
    'feb':'feb',
    'mar':'mar',
    'apr':'apr',
    'may':'may',
    'jun':'jun',
    'jul':'jul',
    'aug':'aug',
    'sep':'set',
    'oct':'sep',
    'nov':'nov',
    'dec':'dec',
    'january':'January',
    'february':'February',
    'march':'March',
    'april':'April',
    'may':'May',
    'june':'June',
    'july':'July',
    'august':'August',
    'september':'September',
    'october':'October',
    'november':'November',
    'december':'December',
    'mon':'mon',
    'tue':'tue',
    'wed':'wed',
    'thu':'thu',
    'fri':'fri',
    'sat':'sat',
    'sun':'sun',
    'lunedi':'Monday',
    'martedi':'Tuesday',
    'mercoledi':'Wednesday',
    'giovedi':'Thursday',
    'venerdi':'Friday',
    'sabato':'Saturday',
    'domenica':'Sunday',
  };

  const ms_per_day = 24 * 60 * 60 * 1000;
  const default_days_order = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];
  const months_label = [ 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec' ];
  const months_fullname = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ];
  const hours = [
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
  ];
  const click = ( navigator.userAgent.match( /(iPad|iPhone|iPod)/g ) ) ? 'touchstart' : 'click';
  let user_days_order, days_order;
  let mode = 'start';

  /**
   * Adds an event handler to the `td.selectable` elements.
   * It's called by {@link module:js/pickerbase.PickerBase#showDateTable|showDateTable} and
   * {@link module:js/pickerbase.PickerBase#showTimeTable|showTimeTable} methods.
   *
   * @param {HTMLDivElement} picker The picker currently open
  */
  this.addEventOnSelect = function( div ) {
    let coll = div.querySelectorAll( 'td.selectable' );

		for( let i = 0, n = coll.length; i < n; i++ ) {
			coll[ i ].addEventListener( 'click', this.onSelectDayOrHour );
		}
  }





  /**
   * Closes the picker and removes the active state from the active button.
   *
   * @param {HTMLDivElement} btn Active button
   * @param {HTMLDivElement} picker The picker currently open
   * @param {int} [msec=0] Number of milliseconds, then the picker is closed
  */
  this.closePicker = function( btn, picker, ms = 0 ) {
    setTimeout( () => {
      btn.classList.remove( 'active' );
      picker.style.display = 'none';
      document.body.removeEventListener( click, this.onClickOutside );
    }, ms );
  }





  /**
   * @desc
   * Returns the classes for the `td` elements that contain the days of calendar.
   * It's used inside a loop both when building table ({@link module:js/pickerbase.PickerBase#onOpenPicker|onOpenPicker})
   * and when updating it ({@link module:js/pickerbase.PickerBase#selectDay|selectDay}).
   *
   * @param {string} day Current day inside a loop
   * @param {Date} date Date object with the year/month info
   * @return {string} Classes to be assigned to the current `td` element
  */
  this.getDayClassName = function( day, date ) {
    let class_name;

    // We don't take hours/minutes/seconds info into account for subsequent date comparisons
    const today = new Date();
    today.setHours( 0, 0, 0, 0 );
    const today_ms = today.getTime();
    const start_date_ms = new Date( this.start_date.getFullYear(), this.start_date.getMonth(), this.start_date.getDate() ).getTime();
    const curr_day_ms = new Date( date.getFullYear(), date.getMonth(), day ).getTime();
    const first_date_ms = new Date( this.first_date.getFullYear(), this.first_date.getMonth(), this.first_date.getDate() ).getTime();
    const last_date_ms = new Date( this.last_date.getFullYear(), this.last_date.getMonth(), this.last_date.getDate() ).getTime();

    class_name = 'day ';
    if( curr_day_ms < first_date_ms || curr_day_ms > last_date_ms ) {
      class_name += 'disabled ';
    } else {
      class_name += 'selectable ';
    }

    if( curr_day_ms == today_ms ) {
      class_name += 'today ';
    }

    if( curr_day_ms == start_date_ms ) {
      class_name += 'start-day ';
    }

    // // Only for intervals
    // if( this.end_date ) {
    //   let end_date_ms = new Date( this.end_date.getFullYear(), this.end_date.getMonth(), this.end_date.getDate() ).getTime();
    //
    // 	// Giorno compreso nell'intervallo
    // 	if( curr_day_ms > start_date_ms && curr_day_ms < end_date_ms ) {
    // 		class_name += ' interval-background';
    // 	}
    // 	// Giorno di fine intervallo
    // 	if( curr_day_ms == end_date_ms ) {
    // 		class_name += ' end-day ';
    // 	}
    // }

    return class_name;
  }





  /**
   * Returns the classes for the `td` elements that contain the hours/minutes pair (HH:mm).
   * It's used inside a loop both when building table ({@link module:js/pickerbase.PickerBase#onOpenPicker|onOpenPicker})
   * and when updating it ({@link module:js/pickerbase.PickerBase#selectHour|selectHour}).
   *
   * @param {string} hour Current hour inside a loop
   * @param {Date} date Date object with the hour/minutes info
   * @return {string} Classes to be assigned to the current `td` element
   */
  this.getHourClassName = function( hour, date ) {
    let selected_hour = ( '0' + date.getHours() ).slice( -2 ) + ':' + ( '0' + date.getMinutes() ).slice( -2 );

    let h = hour.split( ':' );
    // let [ h, m ] = hour.split( ':' );

    let tmp_day = new Date( date.getTime() );
    tmp_day.setHours( h[0], h[1], 0, 0 );

    let class_name = 'hour ';
    if( tmp_day < this.first_date || tmp_day > this.last_date ) {
      class_name += 'disabled';
    } else {
      class_name += 'selectable';
      class_name += ( selected_hour == hour ) ? ' time-selected '+ mode : '';
    }

    return class_name;
  }





  /**
   * This is a click handler that closes the picker if the user clicks outside.
   *
   * @param {Event} e
   *
   * @see {@link module:js/pickerbase.PickerBase#closePicker|closePicker}
  */
  this.onClickOutside = ( e ) => {
    let div = ( mode == 'start' ) ? this.start_picker_div : this.end_picker_div;

    if( e.type == 'touchstart' ) {
      e.clientX = e.touches[0].clientX;
      e.clientY = e.touches[0].clientY;
    }
    let el = document.elementFromPoint( e.clientX, e.clientY );
    let inside = false;

    do {
      if( el.matches( `#${ div.parentElement.id }.datetime-container` ) ) {
        inside = true;
      }
      el = el.parentElement;
    } while( el !== null && el.nodeType === 1 );

    if( !inside )  {
      this.closePicker( div.previousElementSibling.querySelector( '.active' ), div );
    }
  }





  /**
   * This is a click handler triggered when the user opens the picker by clicking either a date button or a time button.
   *
   * @param {Event} e
   *
   * @see {@link module:js/pickerbase.PickerBase#showDateTable|showDateTable}
   * @see {@link module:js/pickerbase.PickerBase#showTimeTable|showTimeTable}
  */
  this.onOpenPicker = ( e ) => {
    const btn = e.currentTarget;
    let picker, date;

    // Adds or removes the active state from current button when it's clicked
    btn.classList.toggle( 'active' );

    // Removes the active state from the other buttons except the current one
    let css_selector = `div#${ this.start_container.id } button`;
    css_selector += ( this.end_container?.id ) ? `, div#${ this.end_container.id } button` : '';
    [].slice.call( document.querySelectorAll( css_selector ) ).forEach( ( item ) => {
      if( item != btn ) {
        item.classList.remove( 'active' )
      }
    } );

    // Is the start or the end date of the interval?
    // Please note, if there is not an interval, only the start date exists
    if( btn.classList.contains( 'start' ) ) {
      picker = this.start_picker_div;
      date = this.start_date;
      mode = 'start';
    } else {
      picker = this.end_picker_div;
      date = this.end_date;
      mode = 'end';
    }


    // If the button has the active state...
    if( btn.classList.contains( 'active' ) ) {
      picker.style.display = 'block';
      document.body.addEventListener( click, this.onClickOutside );

      let substr = ( btn.classList.contains( 'date' ) )? 'Date' : 'Time';
      let method = 'show' + substr + 'Table';
      this[ method ]( picker, date );

      // Checks if the picker exceeds the viewport height
      const rect = picker.getBoundingClientRect();
      const diff = ( rect.top + picker.offsetHeight ) - document.documentElement.clientHeight

      if( diff > 0 ) {
        // Checks if scroll behavior is supported
        if( 'scrollBehavior' in document.documentElement.style ) {
          window.scrollBy( {
            top: diff,
            left: 0,
            behavior: 'smooth'
          } );
        } else {
          window.scrollBy( 0, diff );
        }
      }
    }

    // ...otherwise
    else {
      // The picker was already open, so we close it
      picker.style.display = 'none';
      document.body.removeEventListener( click, this.onClickOutside );
    }
  }





  /**
  * @desc
  * This is a click handler triggered when the user clicks to select either a day or an hour.
  * It passes an object as parameter to {@link module:js/pickerbase.PickerBase#selectDay|selectDay} or
  * to {@link module:js/pickerbase.PickerBase#selectHour|selectHour} depending on the user clicks or to
  * on a day button or on an hour button respectively.
  *
  * These are the object properties if a day button is clicked:
  * - `btn` [HTMLButtonElement] Active button
  * - `container` [HTMLDivElement] Start or end top level container depending on which button was clicked
  * - `date` [Date] Start date or end date
  * - `next_month` [boolean] Is a next month day?
  * - `picker` [HTMLDivElement] Picker to be closed
  * - `prev_month` [boolean] Is a previous month day?
  * - `text` [string] The day number inside `td` element
  *
  * @param {Event} e
  *
  * @see {@link module:js/pickerbase.PickerBase#selectDay|selectDay}
  * @see {@link module:js/pickerbase.PickerBase#selectHour|selectHour}
  */
  this.onSelectDayOrHour = ( e ) => {
    const o = {};
    const t = e.target;

    o.text = t.textContent;

    const if_hour = ( o.text.indexOf(':') != -1 ) ? true : false;

    if( mode == 'start' ) {
      o.date = this.start_date;
      o.container = this.start_container;
      o.btn = ( !if_hour ) ? this.start_date_btn : this.start_time_btn;
      o.picker = this.start_picker_div;
    }
    // else {
    // 	o.date = end_date;
    // 	o.div_close = end_picker_div; // => picker
    // 	o.interval_div = el_end; // => container
    // 	o.btn = ( !if_hour ) ? end_date_btn : end_time_btn;
    // }
    //
    if( if_hour ) {
      // 	let arr = o.text.split(':');
      // 	o.hour = arr[0];
      // 	o.minute = arr[1]
    } else {
      o.prev_month = t.classList.contains('prev-month');
      o.next_month = t.classList.contains('next-month');
    }

    const substr = ( t.classList.contains( 'day' ) )? 'Day' : 'Hour';
    const method = 'select' + substr;
    this[ method ]( o );
  }





  /**
   * @desc
   * Displays date and time in their own buttons.
   * Outputs the date to the value attribute of `input.date_output` according to `setting.date_output` property.
   *
   * @param {HTMLDivElement} div `div` element where to display the date
   * @param {Date} date Date to be displayed
   *
   * @see {@link module:js/pickerbase.PickerBase~getWeekDayNo|getWeekDayNo}
   */
  this.printDateAndTime = function( div, date ) {
    const date_coll = div.querySelectorAll( 'button.date > *' );
    const week_day_span = date_coll[ 0 ];
    const month_day = date_coll[ 1 ];
    const month_year_span = date_coll[ 2 ];
    // const [ week_day_span, month_day, month_year_span ] = div.querySelectorAll( 'button.date > *' );

    const week_day_number = getWeekDayNo( date );

    week_day_span.textContent = this.i18n[ days_order[ week_day_number ] ];
    month_day.textContent = ( '0' + date.getDate() ).slice( -2 );
    month_year_span.innerHTML = `<span data-i18n="${months_label[ date.getMonth() ]}">${this.i18n[ months_label[ date.getMonth() ] ]}</span><br>${date.getFullYear()}`;

    // If there's a time button
    const time_coll = div.querySelectorAll( 'button.time > *' );
    if( time_coll.length > 0 ) {
      const hours = time_coll[ 0 ];
      const minutes = time_coll[ 1 ];
      // const [ hours, minutes ] = time_coll;

      hours.textContent = ( '0' + date.getHours() ).slice( -2 );
      minutes.textContent = `:${ ( '0' + date.getMinutes() ).slice( -2 ) }`;
    }

    let output_date;
    // Offset in milliseconds (because Date.getTimezoneOffset returns minutes)
    var time_zone_offset = ( new Date() ).getTimezoneOffset() * 60000;
    // toISOString with timezone offset, the slice(0, -1) gets rid of the trailing Z
    var full_iso = ( new Date( date.getTime() - time_zone_offset ) ).toISOString().slice( 0, -1 );
    switch( this.date_output ) {
      // YYYY-MM-DDTHH:mm:ss.sss
      case 'full_ISO': output_date = full_iso; break;
      // YYYY-MM-DD
      case 'short_ISO': [ output_date, ] = full_iso.split( 'T' ); break;
      case 'timestamp':
      default:
      output_date = Math.round( date.getTime() / 1000 );
      break;
    }

    div.querySelector( 'input.date_output' ).value = output_date;
  }


  // ---


  /**
   * @desc
	 * Selects the day clicked by the user and then closes the picker,
   * it's called by {@link module:js/pickerbase.PickerBase#onSelectDayOrHour|onSelectDayOrHour} method.
	 *
	 * @param {object} o Object with contextual info.
   *
	 * @see printDateAndTime
	 * @see closePicker
	 */
	this.selectDay = function( o ) {
    // Updates this.start_date or this.end_date after user selection
		if( o.prev_month ) {
			o.date.setFullYear( this.prev_month.getFullYear(), this.prev_month.getMonth(), o.text );
		} else if( o.next_month ) {
			o.date.setFullYear( this.next_month.getFullYear(), this.next_month.getMonth(), o.text );
		} else {
			o.date.setFullYear( this.current_month.getFullYear(), this.current_month.getMonth(), o.text );
		}

		// // Ricava le rispettive date senza differenze di orario
		// let _start_date = new Date( start_date.getFullYear(), start_date.getMonth(), start_date.getDate() );
		// let _end_date = new Date( end_date.getFullYear(), end_date.getMonth(), end_date.getDate() );
		// let _curr_date = new Date( obj.date.getFullYear(), obj.date.getMonth(), obj.date.getDate() );
		// let _min_date = new Date( min_date.getFullYear(), min_date.getMonth(), min_date.getDate() );
		// let _max_date = new Date( max_date.getFullYear(), max_date.getMonth(), max_date.getDate() );
    //
		// this.checkDateTimeContraints( obj, _start_date, _end_date, _curr_date, _min_date, _max_date );

		// Updates day classes after user selection
		let coll = document.querySelectorAll( 'td.selectable' );

		for( let n = coll.length, i = 0; i < n; i++ ) {
			let param, class_name = '';
			if( coll[ i ].classList.contains( 'prev-month' ) ) {
				param = this.prev_month;
				class_name += 'prev-month ';
			}
			else if( coll[ i ].classList.contains( 'next-month' ) ) {
				param = this.next_month;
				class_name += 'next-month ';
			}
			else {
				param = this.current_month;
			}
			class_name += this.getDayClassName( coll[ i ].textContent, param );
			coll[ i ].className = class_name;
		}

		// Stampa nella pagina
		this.printDateAndTime( o.container, o.date );

		// Chiude il pannello attivo e toglie il focus dal pulsante corrispondente
		this.closePicker( o.btn, o.picker, 500 );
	}





  /**
	 * Selects the hour/minute pair clicked by the user and then closes the picker
	 *
	 * @param {object} obj Oggetto contenente tutte le informazioni contestuali calcolate dal metodo chiamante {@link DatePicker#onSelectDayOrHour}
   *
   * @see printDateAndTime
	 * @see closePicker
	 */
	this.selectHour = function( obj ) {
    return;
		// Aggiorna l'orario in memoria di inizio o fine intervallo
		obj.date.setHours( obj.hour, obj.minute, 0, 0 );

		// // Ricava le rispettive date tenendo conto del tempo minimo di intervallo
		// let _start_date = new Date( start_date.getTime() + min_time );
		// let _end_date = new Date( end_date.getTime() - min_time );
		// let _curr_date = new Date( obj.date.getTime() );
		// let _min_date = new Date( min_date.getTime() + min_time );
		// let _max_date = new Date( max_date.getTime() - min_time );
		// this.checkDateTimeContraints( obj, _start_date, _end_date, _curr_date, _min_date, _max_date );

		// Aggiorna la tabella contenente gli orari di inizio o fine intervallo
		let coll = document.querySelectorAll( 'td.selectable' );
		let l = coll.length
		for( let i = 0; i < l; i++ ) {
			coll[i].className = this.getHourClassName( coll[i].textContent, obj.date );
		}

		// Stampa nella pagina
		this.printDateAndTime( obj.interval_div, obj.date );

		// Chiude il pannello
		this.closeDateOrHourTable( obj.btn, obj.div_close, 500 );
	}





  /**
   * @desc
   * Initializes the start date picker properties.
   *
   * @param {HTMLDivElement} el `div` element that will contain the button
   * @param {Date} [start_date_param] Start selected date
   * @param {Date} [first_date_param] First selectable date
   * @param {Date} [last_date_param] Last selectable date
   * @param {number} [first_day_no] Day the week must start with. Accordingly to returned values of `Date.getDate` method, accepted range values are 0-6 where 0 means Sunday, 1 means Monday and so on
   *
   * @see {@link module:js/datepickermixin.exports.DatePickerMixin.getDateBetween|getDateBetween}
   * @see {@link module:js/datepickermixin.exports.DatePickerMixin.roundMinutes|roundMinutes}
   */
  this.setPickerProps = function( el, start_date_param, first_date_param, last_date_param, first_day_no ) {
    // Default start selected date is one day more than current date
    const start_date_default = new Date( Date.now() + ms_per_day );
    let start_date = getDateBetween( start_date_default, start_date_param, el.querySelector( 'input.start_date' ) );

    // Default first selectable date is the current date
    const first_date_default = new Date;
    let first_date = getDateBetween( first_date_default, first_date_param, el.querySelector( 'input.first_date' ) );
    // Start selected date must be greater than or equal to first selectable date
    if( start_date.getTime() < first_date.getTime() ) {
      first_date = start_date;
    }

    // Default last selectable date is one year more than start selected date
    const last_date_default = new Date( start_date.getTime() + ( ms_per_day * 365 ) );
    let last_date = getDateBetween( last_date_default, last_date_param, el.querySelector( 'input.last_date' ) );
    // Last selectable date must be greater than start selected date
    if( last_date.getTime() < start_date.getTime()  ) {
      last_date = last_date_default;
    }

    start_date = roundMinutes( start_date );
    // console.log( start_date );
    first_date = roundMinutes( first_date );
    // console.log( first_date );
    last_date = roundMinutes( last_date );
    // console.log( last_date );

    first_day_no = +first_day_no;
    if( first_day_no > 6 ) {
      first_day_no = 6;
    }

    if( first_day_no > 0 ) {
      const array2 = default_days_order.slice( 0, first_day_no );
      const array1 = default_days_order.slice( first_day_no, default_days_order.length );
      user_days_order = array1.concat( array2 );
    }
    days_order = ( user_days_order ) ? user_days_order : default_days_order;

    this.start_container = el;
    this.start_date = start_date;
    this.first_date = first_date;
    this.last_date = last_date;
  }





  /**
   * @desc
	 * Creates the calendar for the current month inside the picker.
	 *
	 * @param {HTMLDivElement} picker The picker that contains the calendar
	 * @param {Date} date Current date
   *
   * @see {@link module:js/datepickermixin.exports.DatePickerMixin.getWeekDayNo|getWeekDayNo}
   * @see {@link module:js/datepickermixin.exports.DatePickerMixin.getDayClassName|getDayClassName}
	 */
	this.showDateTable = function( picker, date ) {
		let class_name, html = '';

		const month = date.getMonth();
		const year = date.getFullYear();

		// February length
		const feb = ( ( year % 100 != 0 ) && ( year % 4 == 0 ) || ( year % 400 == 0 ) ) ? 29 : 28;
		const total_days = [ '31', feb, '31', '30', '31', '30', '31', '31', '30', '31', '30', '31' ];

    // First day of current month as number
		let week_day = getWeekDayNo( new Date( year, month, 1 ) );

		this.prev_month = new Date( year, ( month - 1 ), 1, date.getHours(), date.getMinutes() );
		const prev_month_total_days = total_days[ this.prev_month.getMonth() ];

		let i = 0
    let j = week_day;
    // This loop displays the last days of the previous month
		while( j > 0 ) {
			i = ( prev_month_total_days - ( j - 1 ) );
			class_name = this.getDayClassName( i, this.prev_month );
			html += `<td class="prev-month ${ class_name }">${ i }</td>`;
			j--;
		}


    this.current_month = new Date( date.getTime() );
		i = 1;
    // This loop displays the days of the current month
		while ( i <= total_days[ month ] ) {
			// Starts a new row
			if( week_day > 6 ) {
				week_day = 0;
				html += "</tr><tr>";
			}

			class_name = this.getDayClassName( i, this.current_month );
      html += `<td class="${ class_name }">${ i }</td>`;

			week_day++;
			i++;
		}

		this.next_month = new Date( year, ( month + 1 ), 1, date.getHours(), date.getMinutes() );
    // This loop displays the first days of the next month
		for( i = 1; week_day <= 6; week_day++, i++ ) {
			class_name = this.getDayClassName( i, this.next_month );
      html += `<td class="next-month ${ class_name }">${ i }</td>`;
		}

		picker.innerHTML =
			`<table class="date">
				<tr>
					<th><a href="javascript:void(0);" class="prev-month">&laquo;</a></th>
					<th colspan="5">
						<span data-i18n="${ months_fullname[ month ] }">${ this.i18n[ months_fullname[ month ] ] }</span>
						<span class="number">${ year }</span>
					</th>
					<th><a href="javascript:void(0);" class="next-month">&raquo;</a></th>
				</tr>
				<tr>
					<td class="day-label" data-i18n="${ days_order[0] }">${ this.i18n[ days_order[0] ] }</td>
					<td class="day-label" data-i18n="${ days_order[1] }">${ this.i18n[ days_order[1] ] }</td>
					<td class="day-label" data-i18n="${ days_order[2] }">${ this.i18n[ days_order[2] ] }</td>
					<td class="day-label" data-i18n="${ days_order[3] }">${ this.i18n[ days_order[3] ] }</td>
					<td class="day-label" data-i18n="${ days_order[4] }">${ this.i18n[ days_order[4] ] }</td>
					<td class="day-label" data-i18n="${ days_order[5] }">${ this.i18n[ days_order[5] ] }</td>
					<td class="day-label" data-i18n="${ days_order[6] }">${ this.i18n[ days_order[6] ] }</td>
				</tr>
				<tr>
				${ html }
				</tr>
			</table>`;

    // Previous month button
		this.prev_month.setDate( prev_month_total_days );
		const prev_month_btn = picker.querySelector( '.prev-month' );
		if( this.prev_month >= this.first_date ) {
			prev_month_btn.addEventListener( 'click', () => this.showDateTable( picker, this.prev_month ) );
		}
		else {
			prev_month_btn.classList.add( 'disabled' );
		}

    // Next month button
		const next_month_btn = picker.querySelector( '.next-month' );
		if( this.last_date > this.next_month ) {
			next_month_btn.addEventListener( 'click', () => this.showDateTable( picker, this.next_month ) );
		}
		else {
			next_month_btn.classList.add( 'disabled' );
		}

    this.addEventOnSelect( picker );
	}




  /**
   * @desc
   * Creates the table of hours inside the picker
	 *
	 * @param {HTMLDivElement} picker The picker that contains the table
	 * @param {Date} day Current day
   *
	 * @see getHourClassName
	 * @see addEventOnSelect
	 */
	this.showTimeTable = function( picker, day ) {
		let i = 0, html = '', class_name;

    // Nine rows
		for( let j = 1; j < 9; j++ ) {
			html += "<tr>";

      // Six columns
			for( i = 1 * i ; i < 6 * j; i++ ) {
				if( hours[ i ] ) {
          class_name = ''
					class_name = this.getHourClassName( hours[ i ], day );

					html += `<td class="${ class_name }">${ hours[ i ] }</td>`;
				} else {
					html += `<td class="white-background disabled"></td>`;
				}
			}

			html += "</tr>";
		}

		picker.innerHTML =
      `<table class="time">
        <tr>
          <th colspan="7">
            <span class="number">${ day.getDate() }</span>
            <span data-i18n="${ months_fullname[ day.getMonth() ] }">${ this.i18n[ months_fullname[ day.getMonth() ] ] }</span>
          </th>
        </tr>
        ${ html }
      </table>`;

		this.addEventOnSelect( picker );
	}





  /**
   * @desc
   * Returns a date depending on these precedence criteria:
   * - the date provided in a hidden input field (if any) takes priority over other dates;
   * - then follows the date provided as parameter of {@link module:js/pickerbase.PickerBase#setPickerProps|setPickerProps} method;
   * - default date comes last.
   *
   * @param {Date} date_default Default date
   * @param {Date|string} date_param The date provided as parameter of setPickerProps method
   * @param {HTMLInputElement|null} input A hidden input field with ISO date string in its value attribute
   * @return {Date}
   *
   * @see {@link module:js/datepickermixin.exports.DatePickerMixin.isISOFormat|isISOFormat}
   */
  function getDateBetween( date_default, date_param, input ) {
    if( typeof date_param == 'string' && isISOFormat( date_param ) ) {
      date_param = new Date( date_param )
    }

    // Date may be invalid even if isISOFormat returns true (for istance '2015-13-25T12:00:00'), that's why we have to check it with isNan
    const date = ( date_param instanceof Date && !isNaN( date_param ) ) ? date_param : date_default;

    let prev_date = input?.value;
    if( prev_date && isISOFormat( prev_date ) ) {
      prev_date = new Date( prev_date );
    }

    return ( !isNaN( prev_date ) ) ? prev_date : date;
  }





  /**
   * @desc
   * Returns the day of the week as number accordingly to `user_days_order` (if any) or `date.getDay` method.
   *
   * @param {Date} date Date we get the day of the week from
   * @return {number} The day of the week as number
   */
  function getWeekDayNo( date ) {
    let week_day = date.getDay();

    if( user_days_order ) {
      week_day = user_days_order.indexOf( default_days_order[ week_day ] );
    }

    return week_day;
  }





  /**
   * @desc
   * Checks if `iso_date` has the right ISO format, it doesn't do date validation.
   * Accepted values: '2015-03-25', '2015-03-25T12:00:00', '2015-03-25T12:00:00Z', '2015-03-25T12:00:00-06:30'.
   *
   * @param {string} iso_date Date string
   * @return {boolean} `true` if format is valid, `false` otherwise
   */
  function isISOFormat( iso_date ) {
    return ( iso_date.match( /^(\d{4})-(\d{2})-(\d{2})(T\d{2}\:\d{2}\:\d{2}[+-]\d{2}\:\d{2})?|Z$/ ) ) ? true : false
  }





  /**
   * @desc
   * Rounds minutes to the next half hour.
   *
   * @param {Date} date The date to be rounded
   * @return {Date} The rounded date
   */
  function roundMinutes( date ) {
    date.setSeconds( 0, 0 );

    let m = date.getMinutes();
    let h = date.getHours();
    if( m > 0 && m <= 30 ) {
      m = 30;
    }
    else if( m > 30 ) {
      m = 0;
      // If we round the minutes to 0 we have to take one more hour into account
      h = h + 1;
      // If, after rounding, midnight is reached, we have to take one more day into account
      if( h == 24 ) {
        h = 0;
        date = new Date( date.getTime() + ms_per_day );
      }
    }
    date.setHours( h, m );

    return date;
  }
}
