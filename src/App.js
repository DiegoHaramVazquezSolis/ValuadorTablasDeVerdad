import React, { useEffect, useReducer, useRef } from 'react';

import './App.css';

import Header from './components/Header/Header';

const symbology = [
	'&',
	'|',
	'!'
];

const App = () => {
	//#region UI things
	const inputRef = useRef(null);

	useEffect(() => {
		inputRef.current.focus();
	}, []);

	//#endregion

	//#region Variables globales y funciones para su manejo
	const initialState = {
		// Arreglo para almacenar todas las proposiciones (cada letra ocupara un indice)
		propositions: [],
		// Referencia para saber cuantas variables se evaluaron en la ultima ejecucion
		lastNumberOfEvaluatedPropositions: 0,
		// Expresion a evaluar
		expression: '',
		// Variable para hacer que parpade el numero de variables al cambiar
		addedProposition: false,
		// Valores obtenidos en la evalacion, cada renglon ocupara un indice
		values: []
	};

	const reducer = (prevState, nextState) => {
        return { ...prevState, ...nextState };
    }

	const [state, setState] = useReducer(reducer, initialState);

	//#endregion

	/**
	 * (Función en desuso, temporalmente no es aplicable, quiza en el futuro si)
	 * Determina si el valor recibido es un simbolo
	 * @param {string} symbol Caracter a evaluar
	 * @returns {boolean} true si el valor es un simbolo valido
	 */
	const isSymbol = (symbol) => symbology.indexOf(symbol) !== - 1 || symbol === '<' || symbol === '-' || symbol === '>';

	/**
	 * Determina con base en exresiones regulares si el valor recibido es una letra
	 * @param {string} letter Letra a evaluar
	 * @returns {boolean} true si el valor enviado es una letra
	 */
	const isLetter = (letter) => {

		// Si no encaja con la expresion regular de una letra
		if (letter.match(/^[a-zA-Z]+$/) === null) {

			// Retorna falso
			return false;
		}

		/**
		 * Si encaja con la expresion regular de una letra y match retorna un arreglo con mas de 0 elementos
		 * retorna verdadero
		 */
		return (letter.match(/^[a-zA-Z]+$/)).length > 0;
	}

	/**
	 * Evalua si esa proposición ya existe en la expresión
	 * @param {string} proposition Letra a evaluar
	 * @returns {boolean} true si la proposición ya habia sido declarada
	 */
	const propositionAlreadyDeclared = (proposition) => state.propositions.indexOf(proposition) !== -1;

	/**
	 * Evalua el caracter ingresado y lo agrega a la expresión de la manera en que lo resuelva
	 * @param {object} e Evento lanzado cuando cambia el texto en la entrada de texto
	 */
	const onExpressionChange = (e) => {
		const newCharacter = e.target.value[e.target.value.length - 1];
		
		// const lastCharacter = e.target.value[e.target.value.length - 2] || '';

		// Completado automatico para la doble implicación
		if (newCharacter === '<') {
			return setState({ expression: `${e.target.value}->` });
		}

		// Completado automatico para la implicación
		if (newCharacter === '-') {
			return setState({ expression: `${e.target.value}>` });
		}

		// Guarda la expresión (convirtiendola a minusculas)
		return setState({ expression: e.target.value.toLowerCase() });
	}

	/**
	 * Evalua la expresión para determinar la cantidad de proposiciones y las posibles valuaciones de las mismas
	 * @param {object} e Evento lanzado por el submit del formulario
	 */
	const evaluateExpression = (e) => {
		e.preventDefault();

		// Vaciamos en variables locales la expresión y las proposiciones
		const { expression, propositions } = state;

		// Recorremos la expresion
		for (let index = 0; index < expression.length; index++) {
			const element = expression[index];

			// Buscamos letras (proposiciones) que aun no hayan sido detectadas
			if (isLetter(element) && !propositionAlreadyDeclared(element)) {
				// Guardamos las proposiciones en el arreglo local de proposiciones
				propositions.push(element);

				// Guardamos las proposiciones en el estado global y notificamos que se agregaron proposiciones
				setState({ propositions, addedProposition: true });
			}
		}

		// Calculamos todas las valuaciones de las proposiciones
		getValuations(propositions);
	}

	/**
	 * Calcula el valor de cada proposicion en cada renglon y almacena los renglones en el estado global
	 * @param {array} propositions Arreglo que contiene todas las proposiciones (letras) de la expresion
	 */
	const getValuations = (propositions) => {

		// Cantidad de elementos (proposiciones) a evaluar
		let numberOfElements = propositions.length;

		// Variable para almacenar de forma temporal cada renglon
		let singleRow = '';

		// Variable para almacenar todos los renglones (cada renglon ocupara un indice)
		let rows = [];

		// Recorremos el arreglo que contiene las proposiciones
		propositions.forEach((proposition) => {

			// Creamos un solo renglon que contenga todas las proposiciones
			singleRow += `${proposition} `;
		});

		// Guardamos esa fila como la primera
		rows.push(singleRow);

		// Vaciamos singleRow
		singleRow = '';

		// For que iterara desde el valor 2 elevado al numero de elementos (proposiciones) hasta 0, disminuyendo uno en cada iteración
		for (let i = Math.pow(2, numberOfElements) - 1; i >= 0; i--) {

			// For que iterara desde numero de elementos (proposiciones) menos 1 hasta 0, disminuyendo uno en cada iteracion
			for (let j = numberOfElements - 1; j >= 0; j--) {

				/**
				 * Construcción de un renglon por medio de la asignación del valor correspondiente a la proposición con base en el
				 * numero de iteracion tanto en i como en j
				 * Math.pow(2, j) 2 elevado a la j esima potencia (valor que depende de la iteración) ej: 2 ^ 1 = 2
				 * i / Math.pow(2, j) Dividimos el numero de iteración (del primer for) entre el valor obtenido en el paso previo
				 * (i / Math.pow(2, j)) % 2 Calculamos el modulo de 2 la operación del paso anterior
				 * parseInt((i / Math.pow(2, j)) % 2) Truncamos a entero el valor obtenido en el paso anterior
				 * parseInt((i / Math.pow(2, j)) % 2) > 0 Si es mayor a cero
				 * ? 'V' asignamos 'V'
				 * : 'F' si no es mayor a cero asignamos 'F'
				 */
				singleRow += `${parseInt((i / Math.pow(2, j)) % 2) > 0 ? 'V' : 'F'} `;
			}

			// Agregamos el renglon calculado al arreglo
			rows.push(singleRow);

			// Vaciamos singleRow
			singleRow = '';
		}

		/**
		 * Guardamos las filas, definimos la cantidad de proposiciones evaluadas y vaciamos las proposiciones para futuras evaluaciones
		 * (todo esto del estado global)
		 */
		setState({ values: rows, lastNumberOfEvaluatedPropositions: numberOfElements, propositions: [] });
	}

	return (
		<div className='App'>
			<Header />
			<div className='row'>
				<div className='col-6'>
					<br/>
					<p>Escriba a continuación su expresión</p>
					<form onSubmit={evaluateExpression}>
						<input
							className='expression-input'
							type='text'
							onChange={onExpressionChange}
							value={state.expression}
							ref={inputRef} />
						<br/>
						<input type='submit' value='Evaluar' className='evaluate-button' />
					</form>
					<p className={state.addedProposition ? 'light' : ''}>
						Variables a evaluar: {state.lastNumberOfEvaluatedPropositions}
					</p>
				</div>
				{/**
					Si el numero de proposiciones es menor a 11
				 */}
				{state.lastNumberOfEvaluatedPropositions < 11 ?
				<div className='col-6'>
					{/**
						Colocamos la tabla con proposiciones a la derecha del formulario para ingresar la expresión
					 */}
					{state.values.length > 0 && state.values.map((row) => (
						<p style={{ textAlign: 'center', letterSpacing: '1.25rem' }}>{row}</p>
					))}
				</div>
				:
				<div className='col-12'>
					{/**
						Si es mayor o igual a 11 colocamos la tabla debajo del formulario para ingresar la expresión
					 */}
					{state.values.length > 0 && state.values.map((row) => (
						<p style={{ textAlign: 'center', letterSpacing: '1.25rem' }}>{row}</p>
					))}
				</div>
				}
			</div>
		</div>
	);
}

export default App;
