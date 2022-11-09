// eslint-disable-next-line @typescript-eslint/no-unused-vars
type InputType = {
	numeroDoDocumento: string,
	tipoDeConexao: string,
	classeDeConsumo: string,
	modalidadeTarifaria: string,
	historicoDeConsumo: number[],
}
type OutputType = {
	elegivel: boolean,
	economiaAnualDeCO2?: number,
	razoesInelegibilidade?: string[],
}


/* Para checar a elegibilidade iremos aplicar os seguintes critérios:
- Classe de consumo da cliente
	- Possíveis Valores: Comercial, Residencial, Industrial, Poder Público, e Rural.
	- Elegíveis: Comercial, Residencial e Industrial.
- Modalidade tarifária
	- Possíveis Valores: Branca, Azul, Verde, e Convencional.
	- Elegíveis: Convencional, Branca.
- Consumo mínimo do cliente
	- O cálculo deve ser feito utilizando a média dos 12 valores mais recentes do histórico de consumo.
		- Clientes com tipo de conexão Monofásica só são elegíveis caso tenham consumo médio acima de 400 kWh.
		- Clientes com tipo de conexão Bifásica só são elegíveis caso tenham consumo médio acima de 500 kWh.
		- Clientes com tipo de conexão Trifásica só são elegíveis caso tenham consumo médio acima de 750 kWh.
- Para calcular a projeção da **economia anual** de CO2, considere que para serem gerados 1000 kWh no Brasil são emitidos em média 84kg de CO2. */
function getReport({ numeroDoDocumento, tipoDeConexao, classeDeConsumo, modalidadeTarifaria, historicoDeConsumo }: InputType) {
	const { consumptionTypeEligible, tariffModalityEligible, mediumConsumptionEligible } = isEligible({ numeroDoDocumento, tipoDeConexao, classeDeConsumo, modalidadeTarifaria, historicoDeConsumo });
	const eligible = consumptionTypeEligible && tariffModalityEligible && mediumConsumptionEligible;

	const output: OutputType = {
		elegivel: eligible,
	};

	if (eligible) {
		output.economiaAnualDeCO2 = getAnnualSavingsProjection({ historicoDeConsumo });
	} else {
		output.razoesInelegibilidade = getIneligibilityReasons({ consumptionTypeEligible, tariffModalityEligible, mediumConsumptionEligible });
	}

	return output;
}

function isEligible({ numeroDoDocumento, tipoDeConexao, classeDeConsumo, modalidadeTarifaria, historicoDeConsumo }: InputType) {
	const consumptionTypeEligible = isConsumptionTypeEligible({ classeDeConsumo })
	const tariffModalityEligible = isTariffModalityEligible({ modalidadeTarifaria })
	const mediumConsumptionEligible = isMediumConsumptionEligible({ tipoDeConexao, historicoDeConsumo });
	return { consumptionTypeEligible, tariffModalityEligible, mediumConsumptionEligible };
}

function isConsumptionTypeEligible({ classeDeConsumo }: { classeDeConsumo: string }) {
	return ['comercial', 'residencial', 'industrial'].includes(classeDeConsumo);
}

function isTariffModalityEligible({ modalidadeTarifaria }: { modalidadeTarifaria: string }) {
	return ['convencional', 'branca'].includes(modalidadeTarifaria);
}

function isMediumConsumptionEligible({ tipoDeConexao, historicoDeConsumo }: { tipoDeConexao: string, historicoDeConsumo: number[] }) {
	const mediumConsumption = historicoDeConsumo.reduce((acc, curr) => acc + curr, 0) / 12;

	switch (tipoDeConexao) {
		case 'monofasico':
			return mediumConsumption > 400;
		case 'bifasico':
			return mediumConsumption > 500;
		case 'trifasico':
			return mediumConsumption > 750;
		default:
			return false;
	}
}

function getAnnualSavingsProjection({ historicoDeConsumo }: { historicoDeConsumo: number[] }): number {
	const annualConsumption = historicoDeConsumo.reduce((acc, curr) => acc + curr, 0);
	return ((annualConsumption / 1000) * 84);
}

function getIneligibilityReasons({ consumptionTypeEligible, tariffModalityEligible, mediumConsumptionEligible }: {
	consumptionTypeEligible: boolean, tariffModalityEligible: boolean, mediumConsumptionEligible: boolean
}) {
	const razoesInelegibilidade = [];
	if (!consumptionTypeEligible) {
		razoesInelegibilidade.push('Classe de consumo não aceita');
	}
	if (!tariffModalityEligible) {
		razoesInelegibilidade.push('Modalidade tarifária não aceita');
	}
	if (!mediumConsumptionEligible) {
		razoesInelegibilidade.push('Consumo médio não aceito');
	}
	return razoesInelegibilidade;
}

const example1 = {
	"numeroDoDocumento": "14041737706",
	"tipoDeConexao": "bifasico",
	"classeDeConsumo": "rural",
	"modalidadeTarifaria": "verde",
	"historicoDeConsumo": [
		3878, // mes atual
		9760, // mes anterior
		5976, // 2 meses atras
		2797, // 3 meses atras
		2481, // 4 meses atras
		5731, // 5 meses atras
		7538, // 6 meses atras
		4392, // 7 meses atras
		7859, // 8 meses atras
		4160, // 9 meses atras
	]
}

console.log(getReport(example1));