// app/api/sheets/eleicao/[id]/route.ts 

import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/services/sheetService';

const PLANILHAS: Record<string, string> = {
  presidente: '1jzmPqJxQDb3HFDCLnipwv9IjdabcArKufoAOl3CwsxI',
  presidente_2: '1JTfd8aGPzbpTgWuZqDqqP4jTL1qntanPCtaFVCFlKoo',
  senador: '1HZeWTnIwjA_spCwShs1nzywtP-VKhLlyvua81IpDvBA',
  governador: '1IVSLlwf4KhylgmtZI0Ww1X8KWKO3Xf-N6iAHbYhPtEY',
  governador_2: '1nCt2gfe3EwwZ8gtNZlZvWwty14bXbPOAXwSEyTlD8XM',
  grupo_federal1: '1nwbckdXt4bINJlBDztIL-cEC1l1IKWLF1JN_9lt5mMM',
  grupo_federal2: '1owUCd9_2KDAjku4glW7vKKzqUaHNGjOjj-28c53hu7M',
  grupo_federal3: '1drzj84mgeXeb54aOW7maPoInpPFaNIyGPKRNLF6mzlI',
  deputado_federaljp: '1Lr5tOdc5hjv8N9NDZEj7wio_9RSpiN_sYSlL0mwGzDw',
  grupo_estadual1: '103MpUrplYDAJf8E6uzQhiiZdPIubmR4IGzMZ4AJ0zNU',
  grupo_estadual2: '1OealcLe59-_89qHYhbQBtRboZ2uu5NXIjXA1L8r9exA',
  grupo_estadual3: '1A4jEJD50oo0OKMJPqu6gQWeFgu-cSDkm-hk0iz-TdZc',
  deputado_estadualjp: '17XG_K7IfGaK8EvwQkSIF1VEecyZcpDtMsZ71gFYDtog',
  presidente_2018: '1gkilbyJBpQHL35X649Cqz3GNh1W-uPHkrdXjwFeqa-c',
  presidente_2018_2: '1t4_xNihGoUl6rcsS5JGXXWpdxXkMA63U6QPt0Jmfgiw',
  senador_2018: '1TSm80-jdQ80sph12JJQXGuSrflcPaCcpUqpIYR39rDo',
  governador_2018: '16f0fpk8Qxb_onji7xtc96L7CJY4Ig8ycDZZTl7Jvk7s',
  grupo_estadual1_2018: '11ac2lLvoBX8-hDptLI7AHjwmt9vJIypE3dtZVp76xTk',
  grupo_estadual2_2018: '1ipa4P8cs9b2s-lm2xWRGchLnHaJx-5UbBInCqIO_Vqk',
  grupo_estadual3_2018: '19LTnYMoVECDrf9z-8JZP-YWYHi_xExboW9wCaH4zdg8',
  deputado_estadualjp_2018: '1y6aRB0u2C69L-PNiG2kWT2_J8iGBJ9NXWkXbc6UFw5s',
  grupo_federal1_2018: '1-3HxYCLvS8sAUTUI0lyL1vca31WJxVNndDBB16MuxFw',
  grupo_federal2_2018: '1epzg6LYi4dI_o4X2HVtDfcFgYGvbenOXetwCGiWfi4s',
  grupo_federal3_2018: '1hc5q5O0p2rBIZMurDsaIEfH1k6iRIDlt3NbomI8OdK8',
  deputado_federaljp_2018: '1NRiwqHPpAAZPWrHJFS6uObvChj7liKJh9IiT_635Ytw',
  locais: '1mk--eC-NvNUkNLq9WPvqTzycDtarByI53DstT-DpJAI',
  vereador_2024:'1OAliRhLbT3BxDBTz78Q3RKvTHa7QzCO0OLGPFv00f-s',
  prefeito_2024:'1Lf2NFiId1C7qoguXIfUSi8Ulmx1zkeeDSANa4sLgGcM',
  vereador_2020: '1_OMGnsBRs0UUKevWCim60KU8CQ-XqrT5ajq1k07nHHY',
  prefeito_2020: '1DeoBU-XA7N5qF33vGtDstlOBL8ocCIvVC0smI0BNNco',
  masculino_divorciado: "1wPNC4RfoQosxZxFHaTQu350_y8hiNDgGvy3muCsBb20",
  masculino_casado: "1rz8spDVxv3ecetj0vkjmDp7FiiVhYzSJr8J6av9iXaI",
  masculino_solteiro: "13NJgfeAzHMYjhpMtlJ4jIagqs3WceoiEaookes5YEus",
  masculino_separado_judicialmente: "1OPOwYAMpYiWJwy8gok2LjV0XUFdJxYmJ3kc316x9pLM",
  masculino_nao_informado: "1hIExWZ-93coSvjafZBLHnadCRGOpyiaLaADmvDUKH7E",
  masculino_viuvo: "1aK-Idjhri-RLiE2gvnPCTH5iikULYi5kGWxSFv6z3pQ",
  feminino_divorciado: "1wV-xn8HAxZO1XDQ95SRHoBslvjxUMXJWg3SQDkHbUg8",
  feminino_casado: "11a-ye4K7GRXUfiAa800F6Id0xuhM79QZHxX5RJjTL0I",
  feminino_separado_judicialmente: "1BaAqEJcUO0XXGIbV_JJtLrNn88x61UjVO_e4fT4zp5A",
  feminino_solteiro: "1GnLhjyUGnFAQ7ITZ5NwRoqQvu97Vi8e4Fat1Ac5x6kQ",
  feminino_viuvo: "1CLeqwa8JVz5lSng2qWTv4siOFoGWrp_ATds_Zibwmls",
};

const SHEET_RANGE = 'Sheet1!A:P';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // CORREÇÃO: Coloque o 'await' de volta aqui, conforme a mensagem de erro do seu ambiente
  const { id } = await params; 
  const spreadsheetId = PLANILHAS[id];

  if (!spreadsheetId) {
    return NextResponse.json(
      { success: false, message: 'Planilha não encontrada.' },
      { status: 404 }
    );
  }

  try {
    const data = await getSheetData(spreadsheetId, SHEET_RANGE);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`Erro ao buscar dados para ID ${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}