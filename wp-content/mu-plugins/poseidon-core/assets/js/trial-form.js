/* Trial form enhancement: sends to the REST route, shows field errors in place, keeps the non-JS fallback working. */
( function () {
	var messages = {
		fr: { ok: 'Merci ! Votre demande est envoyée. Un e-mail de confirmation est en route et le club vous recontacte rapidement.', error: 'Certaines informations sont à corriger.', field: 'Valeur invalide ou manquante.', rate_limited: 'Trop de demandes en peu de temps. Réessayez dans une heure ou écrivez-nous.', token: 'Le formulaire a expiré. Rechargez la page puis réessayez.', network: 'Envoi impossible pour le moment. Vérifiez votre connexion et réessayez.' },
		nl: { ok: 'Bedankt! Uw aanvraag is verstuurd. Er is een bevestigingsmail onderweg en de club neemt snel contact op.', error: 'Sommige gegevens moeten verbeterd worden.', field: 'Ongeldige of ontbrekende waarde.', rate_limited: 'Te veel aanvragen op korte tijd. Probeer het binnen een uur opnieuw of mail ons.', token: 'Het formulier is verlopen. Herlaad de pagina en probeer opnieuw.', network: 'Verzenden lukt nu niet. Controleer uw verbinding en probeer opnieuw.' },
		en: { ok: 'Thank you! Your request has been sent. A confirmation e-mail is on its way and the club will contact you shortly.', error: 'Some details need to be corrected.', field: 'Invalid or missing value.', rate_limited: 'Too many requests in a short time. Try again in an hour or e-mail us.', token: 'The form has expired. Reload the page and try again.', network: 'Sending is not possible right now. Check your connection and try again.' }
	};

	document.querySelectorAll( '[data-poseidon-trial]' ).forEach( function ( form ) {
		var root = form.closest( '[data-poseidon-trial-root]' );
		var status = root.querySelector( '[data-poseidon-trial-status]' );
		var t = messages[ form.elements.lang.value ] || messages.fr;
		var busy = false;

		function say( text, kind ) {
			status.replaceChildren();
			var p = document.createElement( 'p' );
			p.className = 'pos-notice pos-notice--' + kind;
			p.textContent = text;
			status.appendChild( p );
		}

		function clearErrors() {
			form.querySelectorAll( '[data-error-for]' ).forEach( function ( span ) {
				span.textContent = '';
			} );
			form.querySelectorAll( '[aria-invalid]' ).forEach( function ( input ) {
				input.removeAttribute( 'aria-invalid' );
			} );
		}

		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			if ( busy ) {
				return;
			}
			busy = true;
			clearErrors();
			var button = form.querySelector( 'button[type=submit]' );
			button.disabled = true;

			fetch( form.dataset.endpoint, { method: 'POST', body: new FormData( form ), credentials: 'same-origin' } )
				.then( function ( res ) {
					return res.json().then( function ( data ) {
						return { status: res.status, data: data };
					} );
				} )
				.then( function ( r ) {
					if ( r.status === 201 ) {
						form.hidden = true;
						say( t.ok, 'ok' );
						status.setAttribute( 'tabindex', '-1' );
						status.focus();
						return;
					}
					var errors = ( r.data && r.data.errors ) || {};
					if ( errors.form ) {
						say( t[ errors.form ] || t.error, 'error' );
					} else {
						say( t.error, 'error' );
					}
					var first = null;
					Object.keys( errors ).forEach( function ( field ) {
						var span = form.querySelector( '[data-error-for="' + field + '"]' );
						var input = form.elements[ field ];
						if ( span ) {
							span.textContent = t.field;
						}
						if ( input && input.setAttribute ) {
							input.setAttribute( 'aria-invalid', 'true' );
							first = first || input;
						}
					} );
					if ( first ) {
						first.focus();
					}
				} )
				.catch( function () {
					say( t.network, 'error' );
				} )
				.finally( function () {
					busy = false;
					button.disabled = false;
				} );
		} );
	} );
} )();
