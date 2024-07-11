import * as React from 'react';
import styles from './Miaf.module.scss';
import type { IMiafProps } from './IMiafProps';
import { BaseButton, DefaultButton } from "@fluentui/react/lib/Button";
import { MYModal } from "./MYModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import axios from 'axios';
import { ComboBoxVirtualizedExample } from './Comboboxs';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { Icon, Modal, Spinner, SpinnerSize } from '@fluentui/react';



interface IPopupState {
  callchildcomponent: boolean;
  isVisible: boolean,
  rows: IRow[];
  magazadescfilter: Array<any>;
  filteredmagaza: string;
  magazakodu: string;
  mevcutpersonel: string;
  normpersonel: string;
  bolgemudur: string;
  magazamudur: string;
  toplampersonelsayisi: string;
  bmadi: string;
  message: string;
  showModal: boolean;
  showSpinner: boolean;
  isSuccessful: boolean;
  formKontrol: string;
}

interface IRow {
  id: number;
  adSoyad: string;
  tc: string;
  mail: string;
  ogrenim: string;
  ikametgah: string;
  il: string;
  ilce: string;
  evtel: string;
  gsm: string;
  acilGsm: string;
  banka: string;
  subeKodu: string;
  hesapNo: string;
  iban: string;
  tarih2: string;
  tarih3: string;
}


export default class Miaf extends React.Component<IMiafProps, IPopupState> {
  constructor(props: IMiafProps) {
    super(props);

    this.state = {
      callchildcomponent: false,
      isVisible: false,
      magazadescfilter: [],
      filteredmagaza: "",
      magazakodu: "",
      mevcutpersonel: "",
      normpersonel: "",
      bolgemudur: "",
      magazamudur: "",
      toplampersonelsayisi: "",
      bmadi: "",
      message: "Form işleniyor...",
      showModal: false,
      showSpinner: true,
      isSuccessful: false,
      formKontrol: "Başarılı",
      rows: [
        {

          id: 1,
          adSoyad: "",
          mail: "",
          tc: "",
          ogrenim: "",
          ikametgah: "",
          il: "",
          ilce: "",
          evtel: "",
          gsm: "",
          acilGsm: "",
          banka: "",
          subeKodu: "",
          hesapNo: "",
          iban: "",
          tarih2: "",
          tarih3: "",
        },
      ],
    };

    this.handler = this.handler.bind(this);
    this.Buttonclick = this.Buttonclick.bind(this);
  }

  componentDidMount(): void {

    this.magazasorgu();
  }

  exportPDF = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const form = document.getElementById("form");
      if (!form) {
        console.error('Element with id "form" not found');
        reject("Element not found");
        return;
      }

      const textareas = form.querySelectorAll("textarea");
      textareas.forEach(textarea => {
        if (textarea.parentNode) {
          const pElement = document.createElement("p");
          pElement.textContent = textarea.value;
          pElement.className = 'customp'; // Örneğin, "custom-class" adında bir class ekleyelim
          textarea.parentNode.replaceChild(pElement, textarea);
        }
      });

      const imgWidth = 210;
      const imgHeight = 297;
      const pdf = new jsPDF("p", "mm", "a4");

      // Bekleme süresi ekleyerek ilk sayfanın düzgün şekilde yüklenmesini sağlayın
      setTimeout(() => {
        // Görünür kısmı yakalamak için ekran boyutlarını alın
        const scrollY = window.scrollY;
        const windowWidth = window.innerWidth;

        // Formun görünür kısmını yakalayın
        html2canvas(form as HTMLElement, {
          logging: true,
          useCORS: true,
          scale: 2,
          scrollY: -scrollY,
          windowWidth: windowWidth
        }).then((canvas) => {
          pdf.addImage(
            canvas.toDataURL("image/jpeg"),
            "JPEG",
            0,
            0,
            imgWidth,
            imgHeight
          );




          // Diğer sayfalara personel formlarını ekle
          const personelForms = document.querySelectorAll('[id^="personnel"]');

          if (!personelForms.length) {
            console.error('No "personel" forms found');
            reject("No personel forms found");
            return;
          }

          let counter = 0;
          personelForms.forEach((personelForm: HTMLElement) => {
            html2canvas(personelForm, {
              logging: true,
              useCORS: true,
              scale: 2,
              scrollY: -scrollY,
              windowWidth: windowWidth
            }).then((canvas2) => {
              pdf.addPage();
              pdf.addImage(
                canvas2.toDataURL("image/jpeg"),
                "JPEG",
                0,
                0,
                imgWidth,
                imgHeight
              );

              // Tüm personel formları işlendikten sonra PDF'i oluşturun
              counter++;
              if (counter === personelForms.length) {
                const pdfBlob = pdf.output("blob");
                resolve(pdfBlob);
                const pdfFileName = "talepbilgileri.pdf";
                pdf.save(pdfFileName);
                this.setState({ formKontrol: "Başarılı" })
              }
            });
          });
        });
      }, 500); // Örnek olarak 500 milisaniye bekleme süresi ekledik, ihtiyaca göre ayarlayabilirsiniz.
    });
  };

  addAttachment = async (itemId: number): Promise<void> => {
    try {
      const pdfBlob = await this.exportPDF();
      const fileName = "talepbilgileri.pdf";
      const response = await this.props.context.spHttpClient.post(
        `${this.props.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('magazaisealimkayitlari')/items(${itemId})/AttachmentFiles/add(FileName='${fileName}')`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: "application/json;odata=nometadata",
            "Content-type": "application/json;odata=nometadata",
            "odata-version": "",
          },
          body: pdfBlob,
        }
      );



      if (response.ok) {
        console.log("başarılı")
      }
      else {
        console.error("hata oluştu")
      }
    } catch (error) {
      console.error(error);
    }
  };

  private createItem = (): void => {



    const bm = (document.getElementById("bolgemuduruadi") as HTMLInputElement).value;

    let bmadiValue = '';

    switch (bm) {
      case "EVREN BARIŞ BEDESTENCİ":
        bmadiValue = 'baris.bedestenci@panco.com.tr';
        break;
      case "YASİN KÜSKÜ":
        bmadiValue = 'yasin.kusku@panco.com.tr';
        break;
      case "ALİ CEYLAN":
        bmadiValue = 'ali.ceylan@panco.com.tr';
        break;
      case "SERAP BESLİ":
        bmadiValue = 'serap.besli@panco.com.tr';
        break;
      case "GÖZDE ER":
        bmadiValue = 'gozde.er@panco.com.tr';
        break;
      case "EMRE GÜNDÜZ":
        bmadiValue = 'emre.gunduz@panco.com.tr';
        break;
      default:
        bmadiValue = 'bilinmeyen bölge müdürü';
        break;
    }





    const pf = (document.getElementById("pf") as HTMLInputElement);
    let a: string;

    if (pf && pf.value === "Part Time") {
      a = (document.getElementById("parttimegun") as HTMLInputElement)["value"];
    }
    else {
      a = ""
    }
    const body: string = JSON.stringify({


      talepTarihi: (document.getElementById("tarih") as HTMLInputElement)["value"],
      magazaAdi: this.state.filteredmagaza,
      magazaKodu: (document.getElementById("magazakodu") as HTMLInputElement)["value"],
      normPersonel: (document.getElementById("normpersonel") as HTMLInputElement)["value"],
      mevcutPersonel: (document.getElementById("mevcutpersonel") as HTMLInputElement)["value"],
      iseAlimdanSonraToplamPersonel: (document.getElementById("toplampersonel") as HTMLInputElement)["value"],
      bolgeMuduruAdi: bmadiValue,
      magazaMuduruAdi: (document.getElementById("magazamuduruadi") as HTMLInputElement)["value"],
      talepEdilenUnvan: (document.getElementById("talepedilenunvan") as HTMLInputElement)["value"],
      talepEdilenPersonelSayisi: (document.getElementById("talepedilenpersonel") as HTMLInputElement)["value"],
      partFull: (document.getElementById("pf") as HTMLInputElement)["value"],
      partTimeGun: a,
      iseAlimSebebi: (document.getElementById("isealimsebebi") as HTMLTextAreaElement)["value"],
      personelBilgileri: JSON.stringify(this.state.rows),
      formKontrol: this.state.formKontrol,

    });
    const { rows } = this.state;
    // Formdaki input alanlarının doluluğunu kontrol et
    const isFilled = this.isInputFilled(rows);
    if (isFilled) {

      if (this.kontrolEt()) {



        this.props.context.spHttpClient
          .post(
            `${this.props.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('magazaisealimkayitlari')/items`,
            SPHttpClient.configurations.v1,
            {
              headers: {
                Accept: "application/json;odata=nometadata",
                "Content-type": "application/json;odata=nometadata",
                "odata-version": "",
              },
              body: body,
            }
          )
          .then((response: SPHttpClientResponse) => {
            if (response.ok) {
              response.json().then(async (responseJSON) => {
                const newItemId: number = responseJSON.Id;

                this.mesajdegis(newItemId);

              });
            } else {
            }
          })
          .catch((error: any) => {
            console.log(error);
          });

      }
    }

  };


  kontrolEt(): boolean {
    const pf = (document.getElementById("pf") as HTMLInputElement);
    let inputIds: string[];

    if (pf && pf.value === "Full Time") {
      // Yeni durumunda gerekli inputIds
      inputIds = ["tarih", "magazakodu", "mevcutpersonel", "normpersonel", "toplampersonel", "bolgemuduruadi", "magazamuduruadi", "talepedilenunvan", "talepedilenpersonel", "pf", "isealimsebebi"];
    }
    else {
      // Diğer durumlarda gerekli inputIds
      inputIds = ["tarih", "magazakodu", "mevcutpersonel", "normpersonel", "toplampersonel", "bolgemuduruadi", "magazamuduruadi", "talepedilenunvan", "talepedilenpersonel", "pf", "parttimegun", "isealimsebebi"];
    }

    for (const id of inputIds) {
      const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;

      // Boş kontrolü
      if (!element || (element.value.trim() === "" && element.tagName.toLowerCase() !== "textarea")) {
        alert(`Lütfen ${id} alanını doldurunuz.`);
        return false;
      }

      if (element.tagName.toLowerCase() === "textarea" && element.value.trim().length < 50) {
        alert(`Lütfen ${id} alanına en az 50 karakter yazınız.`);
        return false;
      }
    }

    return true;
  };

  isInputFilled(rows: string | any[]) {
    const tcRegex = /^\d{11}$/; // 11 hane uzunluğunda ve sadece rakamlardan oluşan bir regex
    const telRegex = /^\(\d{3}\)\s\d{3}\s\d{2}\s\d{2}$/;
    const ibanRegex = /^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/;


    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Her bir input alanını kontrol et
      if (!row.adSoyad) {
        alert("Ad soyad alanı boş bırakılamaz.");
        return false;
      }
      if (!tcRegex.test(row.tc)) {
        alert("TC kimlik numarası 11 haneli olmalıdır.");
        return false;
      }
      if (!ibanRegex.test(row.iban)) {
        alert("IBAN numarası TR ile başlamalı ve toplamda 26 haneden oluşmalıdır.");
        return false;
      }
      if (!telRegex.test(row.gsm)) {
        alert(" Telefon numarası 10 haneli olmalıdır.");
        return false;
      }
      if (!row.ogrenim) {
        alert("Öğrenim alanı boş bırakılamaz.");
        return false;
      }
      if (!row.ikametgah) {
        alert("İkametgah alanı boş bırakılamaz.");
        return false;
      }
      if (!row.il) {
        alert("İl alanı boş bırakılamaz.");
        return false;
      }
      if (!row.ilce) {
        alert("İlçe alanı boş bırakılamaz.");
        return false;
      }
      if (!row.subeKodu) {
        alert("Şube kodu alanı boş bırakılamaz.");
        return false;
      }
      if (!row.hesapNo) {
        alert("Hesap numarası alanı boş bırakılamaz.");
        return false;
      }
      if (!row.tarih2) {
        alert("İşe başlayacağı Tarihi boş bırakılamaz.");
        return false;
      }
      if (!row.tarih3) {
        alert("İlk İşe başlama Tarihi boş bırakılamaz.");
        return false;
      }
    }
    // Eğer hiçbir input boş değilse ve TC kimlik numarası ve IBAN numarası geçerliyse true döndür
    return true;
  }

  handler() {
    this.setState({
      callchildcomponent: false,
    });
  };

  private Buttonclick(
    e: React.MouseEvent<
      | HTMLDivElement
      | HTMLAnchorElement
      | HTMLButtonElement
      | BaseButton
      | DefaultButton
      | HTMLSpanElement,
      MouseEvent
    >
  ) {
    e.preventDefault();
    this.setState({ callchildcomponent: true });
  };

  private handlePartChance = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inputValue = e.target.value;

    if (inputValue == "Part Time") {

      this.setState({ isVisible: true });
    }
    else {
      this.setState({ isVisible: false });
    }

  };

  private handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number,
    field: string,
  ) => {
    let inputValue = e.target.value;

    if (field === "acilGsm") {
      const numericValue = inputValue.replace(/\D/g, '');
      // Check if the numeric value starts with '5'
      if (numericValue.startsWith('5')) {
        // Format the phone number
        let formattedValue = '(' + numericValue.substring(0, 3) + ') ' + numericValue.substring(3, 6) + ' ' + numericValue.substring(6, 8) + ' ' + numericValue.substring(8, 10);
        inputValue = formattedValue;
      } else {
        inputValue = '';
      }
      const inputElement = document.getElementById('acilGsm') as HTMLInputElement | null;

      // Eğer input alanı bulunursa ve tipi HTMLInputElement ise
      if (inputElement) {
        // Input alanına bir 'keydown' olay dinleyicisi ekleyin
        inputElement.addEventListener('keydown', function (event) {
          // Eğer basılan tuş bir 'backspace' tuşu ise ve input alanı boş değilse
          if (event.key === 'Backspace') {
            // Input alanının değerini boşalt 
            inputElement.value = '';
          }
        });
      }
    }
    else if (field === "gsm") {
      const numericValue = inputValue.replace(/\D/g, '');

      // Check if the numeric value starts with '5' 
      if (numericValue.startsWith('5')) {
        // Format the phone number 
        let formattedValue = '(' + numericValue.substring(0, 3) + ') ' + numericValue.substring(3, 6) + ' ' + numericValue.substring(6, 8) + ' ' + numericValue.substring(8, 10);
        inputValue = formattedValue;
      }
      else {
        inputValue = '';
      }

      // Input alanını seçin
      const inputElement = document.getElementById('gsm') as HTMLInputElement | null;

      // Eğer input alanı bulunursa ve tipi HTMLInputElement ise
      if (inputElement) {
        // Input alanına bir 'keydown' olay dinleyicisi ekleyin
        inputElement.addEventListener('keydown', function (event) {
          // Eğer basılan tuş bir 'backspace' tuşu ise ve input alanı boş değilse
          if (event.key === 'Backspace') {
            // Input alanının değerini boşalt 
            inputElement.value = '';
          }
        });
      }


    }

    else if (field === "evtel") {
      const numericValue = inputValue.replace(/\D/g, '');

      let formattedValue = '(' + numericValue.substring(0, 3) + ') ' + numericValue.substring(3, 6) + ' ' + numericValue.substring(6, 8) + ' ' + numericValue.substring(8, 10);
      inputValue = formattedValue;

      const inputElement = document.getElementById('evtel') as HTMLInputElement | null;

      // Eğer input alanı bulunursa ve tipi HTMLInputElement ise
      if (inputElement) {
        // Input alanına bir 'keydown' olay dinleyicisi ekleyin
        inputElement.addEventListener('keydown', function (event) {
          // Eğer basılan tuş bir 'backspace' tuşu ise ve input alanı boş değilse
          if (event.key === 'Backspace') {
            // Input alanının değerini boşalt 
            inputElement.value = '';
          }
        });
      }
    }

    else if (field === "iban") {
      // Remove all non-alphanumeric characters from the input
      const alphanumericValue = inputValue.replace(/[^a-zA-Z0-9]/g, '');

      // Truncate the value to 26 characters
      const truncatedValue = alphanumericValue.substring(0, 26);

      // Convert to uppercase
      const uppercaseValue = truncatedValue.toUpperCase();

      // Add space after every 4 characters
      let formattedValue = '';
      for (let i = 0; i < uppercaseValue.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += ' ';
        }
        formattedValue += uppercaseValue[i];
      }

      // Show the formatted value
      inputValue = formattedValue;
    }







    else {
      inputValue = e.target.value;
    }

    // Update the state with the updated rows
    this.setState((prevState: any) => {
      const updatedRows = prevState.rows.map((row: IRow) => {
        if (row.id === id) {
          return this.updateRowField(row, field, inputValue);
        } else {
          return row;
        }
      });

      // Set the state with the updated rows
      return { rows: updatedRows };
    });
  };


  private updateRowField = (row: IRow, field: string, value: string) => {
    // Update the specified field in the row
    return {
      ...row,
      [field]: value,
    };
  };
  private addRow() {
    const newRow: IRow = {
      id: this.state.rows.length + 1,
      adSoyad: "",
      tc: "",
      mail: "",
      ogrenim: "",
      ikametgah: "",
      il: "",
      ilce: "",
      evtel: "",
      gsm: "",
      acilGsm: "",
      banka: "",
      subeKodu: "",
      hesapNo: "",
      iban: "",
      tarih2: "",
      tarih3: "",
    };

    this.setState((prevState: any) => ({
      rows: [...prevState.rows, newRow],
    }), () => {
      this.toplam();

    });

  };

  private deleteRow = () => {
    const lastRowId = this.state.rows[this.state.rows.length - 1].id;

    // En son eklenen satırı sil
    const updatedRows = this.state.rows.filter(
      (row: IRow) => row.id !== lastRowId
    );


    this.setState({ rows: updatedRows }, () => {
      // setState tamamlandığında toplam fonksiyonunu çağır
      this.toplam();

    });

  };

  magazasorgu = async (): Promise<void> => {
    try {
      const response = await axios.get('https://satinalmaformu.com/magazalar');



      if (response.status === 200) {
        const responseJSON = response.data;

        const magazadlarıcb = responseJSON.map((item: any, index: number) => ({
          key: index,
          text: item.storedescription,
        }));

        this.setState({ magazadescfilter: magazadlarıcb });




      } else {
        console.error(response.data);
        alert(`Bir terslik var.`);
      }
    } catch (error) {
      console.error(error);
    }
  };
  magazasorgu2 = async (): Promise<void> => {
    try {
      const response = await axios.get('https://satinalmaformu.com/magazalar');



      if (response.status === 200) {
        const responseJSON = response.data;

        const filtrelenenliste = responseJSON.map((item: any, index: number) => ({
          id: index,
          magazaadi: item.storedescription,
          magazakodu: item.storecode,
          bolgemudur: item.bolgemudur,
          magazamudur: item.magazamudur,
          mevcutpersonel: item.mevcutcalisan,
          normpersonel: item.normcalisan
        }));


        const final = filtrelenenliste.filter((item: { magazaadi: any; }) => {

          return (
            item.magazaadi === this.state.filteredmagaza
          );
        });

        this.setState({ magazakodu: final[0].magazakodu })
        this.setState({ magazamudur: final[0].magazamudur })
        this.setState({ mevcutpersonel: final[0].mevcutpersonel })
        this.setState({ bolgemudur: final[0].bolgemudur })
        this.setState({ normpersonel: final[0].normpersonel })
        this.toplam();


      } else {
        console.error(response.data);
        alert(`Bir terslik var.`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  handleMagazaSorguChange = (value: string) => {
    this.setState({ filteredmagaza: value }, () => {
      this.magazasorgu2();

    });

  }; 


  toplam = () => {
    const talepedilenpersonel = parseInt((document.getElementById("talepedilenpersonel") as HTMLInputElement)["value"]);
    const mevcutpersonel = parseInt((document.getElementById("mevcutpersonel") as HTMLInputElement)["value"]);
    const toplampersonel = isNaN(talepedilenpersonel) || isNaN(mevcutpersonel) ? "" : talepedilenpersonel + mevcutpersonel;
    this.setState({ toplampersonelsayisi: toplampersonel.toString() });

  };
  mesajdegis = async (itemId : number) => {
    this.setState({ showModal: true });
    this.setState({ message: "Lütfen sayfayı kapatmayın...  " });
  
    // `addAttachment` fonksiyonunu çağır
    await this.addAttachment(itemId); 
  
    // `addAttachment` tamamlandıktan sonra mesajları güncelle
    this.setState({ message: "Talebiniz başarıyla onaya gönderildi...    " }); 
    this.setState({ showSpinner: false });  
    this.setState({ isSuccessful: true });  
  
    // Sayfayı yenilemeden önce biraz bekle
    setTimeout(() => {
      window.location.reload();
    }, 2000); 
  };
  








  public render(): React.ReactElement<IMiafProps> {

    const a = parseInt(this.state.normpersonel);
    const b = parseInt(this.state.toplampersonelsayisi);
    const c = this.state.isVisible;


    return (
      <div>
        {this.state.showModal && (
          <Modal isOpen={true}>


            <div className={styles.mesbox}>
              <table>
                <tbody>
                  <td>
                    <div>{this.state.message}</div>
                  </td>
                  <td>
                    {this.state.showSpinner ? (
                      <Spinner size={SpinnerSize.large} />
                    ) : (
                      // İşlem başarılı olduğunda onay işareti
                      this.state.isSuccessful && <Icon iconName="CheckMark" style={{ color: 'green', marginLeft: 10, background: 'white' }} />
                    )}
                  </td>
                </tbody>
              </table>
            </div>

          </Modal>
        )}



        <div className={styles.custom} id='form'>
          <div className={styles.container} >
            <div className={styles.row}>
              <div className={styles.column}>

                <div className={styles.fieldLabel2} >
                  <img 
                    src="https://pancogiyim.sharepoint.com/sites/PancoPortal2/_api/siteiconmanager/getsitelogo?type=%271%27&hash=638429017450029270"
                    width={100} 
                  /> 
                </div> 

                <table className={styles.table} id="Giris"> 
                  <thead>
                    <th className={styles.Heading} colSpan={10}>
                      PANÇO GİYİM SANAYİ VE TİCARET A.Ş <br />
                      Mağaza İşe Alım Formu
                    </th>
                  </thead>
                </table>

                <table className={styles.table} id="talep">
                  <thead>
                    <th className={styles.Heading} colSpan={10}>Talep Bilgileri</th>
                  </thead>
                  <tbody>
                    <tr>
                      <th colSpan={10}>
                        <div className={styles.uyari}>
                          <div className={styles.uyari}>
                            {
                              c === true && b - a === 1 ? null : (a < b ? "Belirlenen norm kadro değerinin üzerinde işlem yapılmaktadır." : null)
                            }

                          </div>

                        </div>
                      </th>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Talep Tarihi :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <input
                          type="date"
                          id="tarih"
                          className={styles.input}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Mağaza Adı :
                        </div>
                      </th>

                      <td colSpan={5}>
                        <ComboBoxVirtualizedExample
                          deger={this.state.magazadescfilter}
                          onSelectedValueChange={
                            this.handleMagazaSorguChange
                          }
                        />

                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Mağaza Kodu :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <input
                          type="text"
                          id="magazakodu"
                          className={styles.input}
                          value={this.state.magazakodu}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Norm Kadro Sayısı :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <input
                          type="text"
                          id="normpersonel"
                          className={styles.input}
                          value={this.state.normpersonel}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Mevcut Personel Sayısı :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <input
                          type="text"
                          id="mevcutpersonel"
                          className={styles.input}
                          value={this.state.mevcutpersonel}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          İşe Alım sonrası Personel Sayısı :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <input
                          type="text"
                          id="toplampersonel"
                          className={styles.input}
                          value={this.state.toplampersonelsayisi}
                          readOnly
                        />
                      </td>

                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Bölge Müdürü Adı :
                        </div>

                      </th>

                      <td colSpan={5}>
                        <input
                          type="text"
                          id="bolgemuduruadi"
                          className={styles.input}
                          value={this.state.bolgemudur}
                        />
                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Mağaza Müdürü Adı :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <input
                          type="text"
                          id="magazamuduruadi"
                          className={styles.input}
                          value={this.state.magazamudur}
                        />
                      </td>
                    </tr>

                    <tr >
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Talep Edilen Unvan :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <select
                          id="talepedilenunvan"
                          className={styles.input}
                          placeholder='seçiniz'
                        >
                          <option value="Satış Danışmanı">Satış Danışmanı</option>
                          <option value="Uzman Satış Danışmanı">Uzman Satış Danışmanı</option>
                          <option value="Mağaza Müdür Yardımcısı">Mağaza Müdür Yardımcısı</option>
                          <option value="Mağaza Müdürü">Mağaza Müdürü</option>
                        </select>
                      </td>
                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Talep Edilen Personel Sayısı :
                        </div>
                      </th>
                      <td colSpan={3}>
                        <input
                          type="text"
                          id="talepedilenpersonel"
                          className={styles.input}
                          value={this.state.rows.length}

                        />
                      </td>
                      <td colSpan={2}>
                        <button
                          className={styles.customAddButton}
                          onClick={() =>
                            this.addRow()
                          }
                        >
                          arttır
                        </button>

                        <button
                          className={styles.customDeleteButton}
                          onClick={() => this.deleteRow()}
                        >
                          azalt
                        </button>
                      </td>


                    </tr>

                    <tr>
                      <th colSpan={5}>
                        <div className={styles.fieldLabel}>
                          Part / Full :
                        </div>
                      </th>
                      <td colSpan={5}>
                        <select
                          id="pf"
                          className={styles.input}
                          onChange={this.handlePartChance}
                          placeholder='seçiniz'
                        >
                          <option value="Full Time">Full Time Çalışma</option>
                          <option value="Part Time">Part Time Çalışma</option>
                        </select>
                      </td>
                    </tr>

                    {this.state.isVisible && (
                      <tr>
                        <th colSpan={5}>
                          <div className={styles.fieldLabel}>
                            Parttime Çalışacağı Gün Sayısı :
                          </div>
                        </th>
                        <td colSpan={5}>
                          <select
                            id="parttimegun"
                            className={styles.input}
                          >
                            <option value="Seçiniz">Seçiniz</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        </td>
                      </tr>
                    )}
                    {!this.state.isVisible && null}

                    <tr>
                      <td colSpan={10}>
                        <div className={styles.fieldLabel4}>
                          İşe Alım Sebebi :
                        </div>
                        <br />
                        <div className={styles.fieldLabel6}>
                          <textarea
                            required
                            className={styles.input3}
                            id="isealimsebebi"
                          />
                        </div>
                      </td>
                    </tr>



                  </tbody>
                </table>

                {this.state.callchildcomponent && (
                  <MYModal handler={() => this.setState({ callchildcomponent: false })}>

                    <div id="phepsi">
                      {this.state.rows.map((row: IRow, index: number) => (
                        <div className={styles.custom2} >
                          <div className={styles.container} id={`personnel${index + 1}`} >
                            <div className={styles.row} >
                              <div className={styles.column} >
                                <table className={styles.table} key={row.id}>
                                  <tbody>

                                    <tr>
                                      <th className={styles.Heading} colSpan={2}  >Personel {row.id}</th>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} > Ad Soyad </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="adsoyad"
                                          className={styles.input2}
                                          value={row.adSoyad}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "adSoyad")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} >
                                          TC Kimlik No
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="tc"
                                          className={styles.input2}
                                          value={row.tc}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "tc")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} >
                                          Mail adresi
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="mail"
                                          className={styles.input2}
                                          value={row.mail}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "mail")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} >
                                          Öğrenim Durumu
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="ogrenimdurumu"
                                          className={styles.input2}
                                          value={row.ogrenim}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "ogrenim")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} >
                                          İkametgah Adresi
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="ikametgah"
                                          className={styles.input2}
                                          value={row.ikametgah}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "ikametgah")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} >
                                          İl
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="il"
                                          className={styles.input2}
                                          value={row.il}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "il")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4} >
                                          İlçe
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="ilce"
                                          className={styles.input2}
                                          value={row.ilce}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "ilce")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          Ev Tel:
                                        </div>
                                      </th>
                                      <td>
                                        <TooltipHost
                                          content="ev telefonu numarası '2' ile başlamalı ve 10 haneli olmalıdır"
                                          id={"evtel"}
                                        >
                                          <input
                                            type="text"
                                            id="evtel"
                                            className={styles.input2}
                                            value={row.evtel}
                                            onChange={(e) =>
                                              this.handleInputChange(e, row.id, "evtel")
                                            }
                                            aria-describedby='evtel'
                                          />
                                        </TooltipHost>
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          Gsm No
                                        </div>
                                      </th>
                                      <td>
                                        <TooltipHost
                                          content="Telefon numarası '5' ile başlamalı ve 10 haneli olmalıdır"
                                          id={"gsm"}
                                        >

                                          <input
                                            type="text"
                                            id="gsm"
                                            className={styles.input2}
                                            value={row.gsm}
                                            onChange={(e) =>
                                              this.handleInputChange(e, row.id, "gsm")
                                            }
                                            aria-describedby='gsm'
                                          />
                                        </TooltipHost>

                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          Acil Durumlar İçin GSM No
                                        </div>
                                      </th>
                                      <td>
                                        <TooltipHost
                                          content="Telefon numarası '5' ile başlamalı ve 10 haneli olmalıdır"
                                          id={"acilGsm"}
                                        >

                                          <input

                                            type="text"
                                            id="acilGsm"
                                            className={styles.input2}
                                            value={row.acilGsm}
                                            onChange={(e) =>
                                              this.handleInputChange(e, row.id, "acilGsm")
                                            }
                                            aria-describedby='acilGsm'
                                          />
                                        </TooltipHost>

                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          Banka Adı
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="talepedilenpersonel"
                                          className={styles.input2}
                                          value={"Garanti Bankası"}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "talepEdilenPersonel")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          Şube Kodu
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="subekodu"
                                          className={styles.input2}
                                          value={row.subeKodu}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "subeKodu")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          Hesap No
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="text"
                                          id="hesapno"
                                          className={styles.input2}
                                          value={row.hesapNo}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "hesapNo")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          IBAN
                                        </div>
                                      </th>
                                      <td>
                                        <TooltipHost
                                          content="IBAN numarası TR ile başlamalı ve 26 haneli olmalıdır"
                                          id={"iban"}
                                        >
                                          <input
                                            type="text"
                                            id="iban"
                                            className={styles.input2}
                                            value={row.iban}
                                            onChange={(e) =>
                                              this.handleInputChange(e, row.id, "iban")
                                            }
                                            aria-describedby='iban'
                                          />
                                        </TooltipHost>
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          İşe Başlayacağı Tarih
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="date"
                                          id="tarih2"
                                          className={styles.input2}
                                          value={row.tarih2}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "tarih2")
                                          }
                                        />
                                      </td>
                                    </tr>

                                    <tr>
                                      <th>
                                        <div className={styles.fieldLabel4}>
                                          İlk İşe Başlama Tarihi
                                        </div>
                                      </th>
                                      <td>
                                        <input
                                          type="date"
                                          id="tarih3"
                                          className={styles.input2}
                                          value={row.tarih3}
                                          onChange={(e) =>
                                            this.handleInputChange(e, row.id, "tarih3")
                                          }
                                        />
                                      </td>

                                    </tr>

                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.ortala}>
                      <button
                        className={styles.customSubmitButton}
                        onClick={this.createItem}
                      >
                        Gönder
                      </button>
                    </div>
                  </MYModal>
                )}


              </div>
            </div>
          </div>
        </div>

        <br />

        <div className={styles.ortala} >


          <DefaultButton
            onClick={(e) => this.Buttonclick(e)}
            text="Personel bilgilerini girmek için tıklayın"
            className={styles.customGirisButton}
          />



        </div>



      </div>
    );
  }
} 
