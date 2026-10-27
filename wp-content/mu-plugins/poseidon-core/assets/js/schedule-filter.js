/* Timetable filter: hides classes that do not fit the visitor's age and level. Pure DOM, no dependency. */
( function () {
	function num( value ) {
		return value === '' || value === undefined ? null : Number( value );
	}

	function fits( row, age, rank ) {
		var d = row.dataset;
		if ( age !== null && ( ( num( d.ageMin ) !== null && age < num( d.ageMin ) ) || ( num( d.ageMax ) !== null && age > num( d.ageMax ) ) ) ) {
			return false;
		}
		if ( rank !== null && ( ( num( d.rankMin ) !== null && rank < num( d.rankMin ) ) || ( num( d.rankMax ) !== null && rank > num( d.rankMax ) ) ) ) {
			return false;
		}
		return true;
	}

	function apply( root, form ) {
		var age = num( form.elements.age.value.trim() );
		var rank = num( form.elements.rank.value );
		var shown = 0;
		root.querySelectorAll( '.pos-session' ).forEach( function ( row ) {
			var ok = fits( row, age, rank );
			row.hidden = ! ok;
			if ( ok ) {
				shown++;
			}
		} );
		root.querySelectorAll( '.pos-schedule__day' ).forEach( function ( day ) {
			day.hidden = ! day.querySelector( '.pos-session:not([hidden])' );
		} );
		root.querySelector( '[data-poseidon-schedule-empty]' ).hidden = shown > 0;
	}

	document.querySelectorAll( '[data-poseidon-schedule]' ).forEach( function ( root ) {
		var form = root.querySelector( '[data-poseidon-schedule-filter]' );
		if ( ! form ) {
			return;
		}
		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
		} );
		form.addEventListener( 'input', function () {
			apply( root, form );
		} );
		form.addEventListener( 'reset', function () {
			setTimeout( function () {
				apply( root, form );
			} );
		} );
	} );
} )();
