const CryptoJS = require("crypto-js");

async function getToken() {
  let token = "";
  // Just in case the update fails
  let doRefresh = true;
  try {
    const tokenObj = JSON.parse(
      Zotero.Prefs.get("ZoteroPDFTranslate.cnkiToken") as string
    );
    if (
      tokenObj &&
      tokenObj.token &&
      new Date().getTime() - tokenObj.token.t < 300 * 1000
    ) {
      token = tokenObj.token;
      doRefresh = false;
    }
  } catch (e) {}
  if (doRefresh) {
    const xhr = await Zotero.HTTP.request(
      "GET",
      "https://dict.cnki.net/fyzs-front-api/getToken",
      {
        responseType: "json",
      }
    );
    if (xhr && xhr.response && xhr.response.code === 200) {
      token = xhr.response.token;
      Zotero.Prefs.set(
        "ZoteroPDFTranslate.cnkiToken",
        JSON.stringify({
          t: new Date().getTime(),
          token: xhr.response.data,
        })
      );
    }
  }
  return token;
}

function getWord(t) {
  var n = "4e87183cfd3a45fe";
  var e = { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
    i = CryptoJS.enc.Utf8.parse(n),
    s = CryptoJS.AES.encrypt(t, i, e),
    r = s.toString().replace(/\//g, "_");
  return (r = r.replace(/\+/g, "-")), r;
}

async function cnki(text: string = undefined) {
  let args = this.getArgs("cnki", text);

  return await this.requestTranslate(
    async () => {
      return await Zotero.HTTP.request(
        "POST",
        "https://dict.cnki.net/fyzs-front-api/translate/literaltranslation",
        {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Token: await getToken(),
          },
          body: JSON.stringify({
            words: getWord(args.text),
            translateType: null,
          }),
          responseType: "json",
        }
      );
    },
    (xhr) => {
      let tgt = xhr.response.data?.mResult;
      Zotero.debug(tgt);
      if (!text) Zotero.ZoteroPDFTranslate._translatedText = tgt;
      return tgt;
    }
  );
}

export { cnki };
