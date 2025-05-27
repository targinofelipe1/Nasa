import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/services/sheetService';

const PLANILHAS: Record<string, string> = {
  presidente: '1jzmPqJxQDb3HFDCLnipwv9IjdabcArKufoAOl3CwsxI',
  senador: '1HZeWTnIwjA_spCwShs1nzywtP-VKhLlyvua81IpDvBA',
  governador: '1IVSLlwf4KhylgmtZI0Ww1X8KWKO3Xf-N6iAHbYhPtEY',
  grupo_federal1: '1nwbckdXt4bINJlBDztIL-cEC1l1IKWLF1JN_9lt5mMM',
  grupo_federal2: '1owUCd9_2KDAjku4glW7vKKzqUaHNGjOjj-28c53hu7M',
  grupo_federal3: '1drzj84mgeXeb54aOW7maPoInpPFaNIyGPKRNLF6mzlI',
  deputado_federaljp: '1Lr5tOdc5hjv8N9NDZEj7wio_9RSpiN_sYSlL0mwGzDw',
  grupo_estadual1: '103MpUrplYDAJf8E6uzQhiiZdPIubmR4IGzMZ4AJ0zNU',
  grupo_estadual2: '1OealcLe59-_89qHYhbQBtRboZ2uu5NXIjXA1L8r9exA',
  grupo_estadual3: '1A4jEJD50oo0OKMJPqu6gQWeFgu-cSDkm-hk0iz-TdZc',
  deputado_estadualjp: '17XG_K7IfGaK8EvwQkSIF1VEecyZcpDtMsZ71gFYDtog',
  presidente_2018: '1gkilbyJBpQHL35X649Cqz3GNh1W-uPHkrdXjwFeqa-c',
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
};

const SHEET_RANGE = 'Sheet1!A:O';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Await params antes de acessar suas propriedades
  const { id } = await params; // <--- Alteração aqui
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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}