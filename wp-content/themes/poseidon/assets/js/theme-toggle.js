/* Light/dark toggle. The choice is kept in localStorage (no cookie); without a choice the device setting applies. */
( function () {
	var root = document.documentElement;
	var labels = { fr: [ 'Mode sombre', 'Mode clair' ], nl: [ 'Donkere modus', 'Lichte modus' ], en: [ 'Dark mode', 'Light mode' ] };
	var lang = ( root.lang || 'fr' ).slice( 0, 2 );
	var t = labels[ lang ] || labels.fr;

	function stored() {
		try {
			return localStorage.getItem( 'poseidon-theme' );
		} catch ( e ) {
			return null;
		}
	}

	function isDark() {
		var s = root.dataset.theme;
		return s ? s === 'dark' : window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
	}

	var saved = stored();
	if ( saved === 'dark' || saved === 'light' ) {
		root.dataset.theme = saved;
	}

	document.querySelectorAll( '[data-poseidon-theme-toggle]' ).forEach( function ( button ) {
		function sync() {
			var dark = isDark();
			button.setAttribute( 'aria-pressed', dark ? 'true' : 'false' );
			button.textContent = dark ? t[ 1 ] : t[ 0 ];
		}
		sync();
		button.hidden = false;
		button.addEventListener( 'click', function () {
			root.dataset.theme = isDark() ? 'light' : 'dark';
			try {
				localStorage.setItem( 'poseidon-theme', root.dataset.theme );
			} catch ( e ) {}
			sync();
		} );
	} );
} )();
