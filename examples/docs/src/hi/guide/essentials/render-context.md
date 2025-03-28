---
titleSuffix: Esmx फ्रेमवर्क सर्वर-साइड रेंडरिंग कोर मैकेनिज्म
description: Esmx फ्रेमवर्क के रेंडरिंग कॉन्टेक्स्ट (RenderContext) मैकेनिज्म का विस्तृत विवरण, जिसमें संसाधन प्रबंधन, HTML जनरेशन और ESM मॉड्यूल सिस्टम शामिल हैं, डेवलपर्स को सर्वर-साइड रेंडरिंग फीचर्स को समझने और उपयोग करने में मदद करता है।
head:
  - - meta
    - property: keywords
      content: Esmx, रेंडरिंग कॉन्टेक्स्ट, RenderContext, SSR, सर्वर-साइड रेंडरिंग, ESM, संसाधन प्रबंधन
---

# रेंडरिंग कॉन्टेक्स्ट

RenderContext Esmx फ्रेमवर्क में एक कोर क्लास है, जो मुख्य रूप से सर्वर-साइड रेंडरिंग (SSR) प्रक्रिया में संसाधन प्रबंधन और HTML जनरेशन के लिए जिम्मेदार है। इसकी निम्नलिखित मुख्य विशेषताएं हैं:

1. **ESM आधारित मॉड्यूल सिस्टम**
   - आधुनिक ECMAScript Modules मानक का उपयोग करता है
   - नेटिव मॉड्यूल इम्पोर्ट/एक्सपोर्ट का समर्थन करता है
   - बेहतर कोड स्प्लिटिंग और ऑन-डिमांड लोडिंग को सक्षम करता है

2. **स्मार्ट डिपेंडेंसी कलेक्शन**
   - वास्तविक रेंडरिंग पथ के आधार पर डायनामिक डिपेंडेंसी कलेक्शन
   - अनावश्यक संसाधन लोडिंग से बचता है
   - एसिंक्रोनस कंपोनेंट्स और डायनामिक इम्पोर्ट का समर्थन करता है

3. **सटीक संसाधन इंजेक्शन**
   - संसाधन लोडिंग ऑर्डर को सख्ती से नियंत्रित करता है
   - फर्स्ट-स्क्रीन लोडिंग परफॉर्मेंस को ऑप्टिमाइज़ करता है
   - क्लाइंट-साइड एक्टिवेशन (Hydration) की विश्वसनीयता सुनिश्चित करता है

4. **लचीला कॉन्फ़िगरेशन मैकेनिज्म**
   - डायनामिक बेस पाथ कॉन्फ़िगरेशन का समर्थन करता है
   - कई इम्पोर्ट मैपिंग मोड प्रदान करता है
   - विभिन्न डिप्लॉयमेंट सीनारियो के लिए अनुकूल

## उपयोग विधि

Esmx फ्रेमवर्क में, डेवलपर्स को आमतौर पर सीधे RenderContext इंस्टेंस बनाने की आवश्यकता नहीं होती है, बल्कि `esmx.render()` मेथड के माध्यम से इंस्टेंस प्राप्त किया जाता है:

```ts title="src/entry.node.ts"
async server(esmx) {
    const server = http.createServer((req, res) => {
        // स्टेटिक फाइल हैंडलिंग
        esmx.middleware(req, res, async () => {
            // esmx.render() के माध्यम से RenderContext इंस्टेंस प्राप्त करें
            const rc = await esmx.render({
                params: {
                    url: req.url
                }
            });
            // HTML कंटेंट को रिस्पॉन्ड करें
            res.end(rc.html);
        });
    });
}
```

## मुख्य फीचर्स

### डिपेंडेंसी कलेक्शन

RenderContext एक स्मार्ट डिपेंडेंसी कलेक्शन मैकेनिज्म को इम्प्लीमेंट करता है, जो वास्तविक रेंडरिंग कंपोनेंट्स के आधार पर डायनामिक डिपेंडेंसी कलेक्ट करता है, न कि सभी संभावित संसाधनों को प्री-लोड करता है:

#### ऑन-डिमांड कलेक्शन
- कंपोनेंट्स के वास्तविक रेंडरिंग प्रक्रिया में मॉड्यूल डिपेंडेंसी को ऑटोमेटिकली ट्रैक और रिकॉर्ड करता है
- केवल वर्तमान पेज रेंडरिंग में वास्तव में उपयोग किए गए CSS, JavaScript आदि संसाधनों को कलेक्ट करता है
- `importMetaSet` के माध्यम से प्रत्येक कंपोनेंट की मॉड्यूल डिपेंडेंसी को सटीक रूप से रिकॉर्ड करता है
- एसिंक्रोनस कंपोनेंट्स और डायनामिक इम्पोर्ट की डिपेंडेंसी कलेक्शन का समर्थन करता है

#### ऑटोमेटेड हैंडलिंग
- डेवलपर्स को मैन्युअल रूप से डिपेंडेंसी कलेक्शन प्रक्रिया को मैनेज करने की आवश्यकता नहीं है
- फ्रेमवर्क कंपोनेंट्स रेंडरिंग के दौरान ऑटोमेटिकली डिपेंडेंसी इन्फॉर्मेशन कलेक्ट करता है
- `commit()` मेथड के माध्यम से सभी कलेक्टेड संसाधनों को यूनिफाइड हैंडल करता है
- सर्कुलर डिपेंडेंसी और डुप्लिकेट डिपेंडेंसी को ऑटोमेटिकली हैंडल करता है

#### परफॉर्मेंस ऑप्टिमाइज़ेशन
- अनुपयोगी मॉड्यूल्स को लोड करने से बचता है, जिससे फर्स्ट-स्क्रीन लोडिंग टाइम में उल्लेखनीय कमी आती है
- संसाधन लोडिंग ऑर्डर को सटीक रूप से नियंत्रित करता है, पेज रेंडरिंग परफॉर्मेंस को ऑप्टिमाइज़ करता है
- ऑप्टिमल इम्पोर्ट मैप (Import Map) को ऑटोमेटिकली जनरेट करता है
- संसाधन प्री-लोडिंग और ऑन-डिमांड लोडिंग स्ट्रैटेजी का समर्थन करता है

### संसाधन इंजेक्शन

RenderContext विभिन्न प्रकार के संसाधनों को इंजेक्ट करने के लिए कई मेथड्स प्रदान करता है, प्रत्येक मेथड को संसाधन लोडिंग परफॉर्मेंस को ऑप्टिमाइज़ करने के लिए डिज़ाइन किया गया है:

- `preload()`: CSS और JS संसाधनों को प्री-लोड करता है, प्रायोरिटी कॉन्फ़िगरेशन का समर्थन करता है
- `css()`: फर्सट-स्क्रीन स्टाइलशीट्स को इंजेक्ट करता है, क्रिटिकल CSS एक्सट्रैक्शन का समर्थन करता है
- `importmap()`: मॉड्यूल इम्पोर्ट मैपिंग को इंजेक्ट करता है, डायनामिक पाथ रेजोल्यूशन का समर्थन करता है
- `moduleEntry()`: क्लाइंट-साइड एंट्री मॉड्यूल को इंजेक्ट करता है, मल्टी-एंट्री कॉन्फ़िगरेशन का समर्थन करता है
- `modulePreload()`: मॉड्यूल डिपेंडेंसी को प्री-लोड करता है, ऑन-डिमांड लोडिंग स्ट्रैटेजी का समर्थन करता है

### संसाधन इंजेक्शन ऑर्डर

RenderContext संसाधन इंजेक्शन ऑर्डर को सख्ती से नियंत्रित करता है, यह ऑर्डर डिज़ाइन ब्राउज़र के कार्य प्रणाली और परफॉर्मेंस ऑप्टिमाइज़ेशन को ध्यान में रखकर किया गया है:

1. head भाग:
   - `preload()`: CSS और JS संसाधनों को प्री-लोड करता है, ब्राउज़र को इन संसाधनों को जल्दी खोजने और लोड करने में सक्षम बनाता है
   - `css()`: फर्स्ट-स्क्रीन स्टाइलशीट्स को इंजेक्ट करता है, पेज कंटेंट रेंडरिंग के समय स्टाइल्स को तैयार रखता है

2. body भाग:
   - `importmap()`: मॉड्यूल इम्पोर्ट मैपिंग को इंजेक्ट करता है, ESM मॉड्यूल्स के पाथ रेजोल्यूशन नियमों को परिभाषित करता है
   - `moduleEntry()`: क्लाइंट-साइड एंट्री मॉड्यूल को इंजेक्ट करता है, जो importmap के बाद ही एक्ज़ीक्यूट होना चाहिए
   - `modulePreload()`: मॉड्यूल डिपेंडेंसी को प्री-लोड करता है, जो importmap के बाद ही एक्ज़ीक्यूट होना चाहिए

## पूर्ण रेंडरिंग प्रक्रिया

एक टाइपिकल RenderContext उपयोग प्रक्रिया निम्नलिखित है:

```ts title="src/entry.server.ts"
export default async (rc: RenderContext) => {
    // 1. पेज कंटेंट रेंडर करें और डिपेंडेंसी कलेक्ट करें
    const app = createApp();
    const html = await renderToString(app, {
       importMetaSet: rc.importMetaSet
    });

    // 2. डिपेंडेंसी कलेक्शन को कमिट करें
    await rc.commit();
    
    // 3. पूर्ण HTML जनरेट करें
    rc.html = `
        <!DOCTYPE html>
        <html>
        <head>
            ${rc.preload()}
            ${rc.css()}
        </head>
        <body>
            ${html}
            ${rc.importmap()}
            ${rc.moduleEntry()}
            ${rc.modulePreload()}
        </body>
        </html>
    `;
};
```

## एडवांस्ड फीचर्स

### बेस पाथ कॉन्फ़िगरेशन

RenderContext एक लचीला डायनामिक बेस पाथ कॉन्फ़िगरेशन मैकेनिज्म प्रदान करता है, जो रनटाइम में स्टेटिक संसाधनों के बेस पाथ को डायनामिक रूप से सेट करने का समर्थन करता है:

```ts title="src/entry.node.ts"
const rc = await esmx.render({
    base: '/esmx',  // बेस पाथ सेट करें
    params: {
        url: req.url
    }
});
```

यह मैकेनिज्म विशेष रूप से निम्नलिखित सीनारियो के लिए उपयोगी है:

1. **मल्टी-लैंग्वेज साइट डिप्लॉयमेंट**
   ```
   मुख्य डोमेन.com      → डिफ़ॉल्ट भाषा
   मुख्य डोमेन.com/cn/  → चीनी साइट
   मुख्य डोमेन.com/en/  → अंग्रेजी साइट
   ```

2. **माइक्रो-फ्रंटएंड एप्लिकेशन**
   - सब-एप्लिकेशन को विभिन्न पाथ्स पर लचीले ढंग से डिप्लॉय करने का समर्थन करता है
   - विभिन्न मुख्य एप्लिकेशन में इंटीग्रेट करने में सुविधा प्रदान करता है

### इम्पोर्ट मैपिंग मोड

RenderContext दो इम्पोर्ट मैपिंग (Import Map) मोड प्रदान करता है:

1. **Inline मोड** (डिफ़ॉल्ट)
   - इम्पोर्ट मैप को सीधे HTML में इनलाइन करता है
   - छोटे एप्लिकेशन के लिए उपयुक्त, अतिरिक्त नेटवर्क रिक्वेस्ट को कम करता है
   - पेज लोडिंग के समय तुरंत उपलब्ध होता है

2. **JS मोड**
   - एक्सटर्नल JavaScript फाइल के माध्यम से इम्पोर्ट मैप लोड करता है
   - बड़े एप्लिकेशन के लिए उपयुक्त, ब्राउज़र कैशिंग मैकेनिज्म का लाभ उठा सकता है
   - मैपिंग कंटेंट को डायनामिक रूप से अपडेट करने का समर्थन करता है

कॉन्फ़िगरेशन के माध्यम से उपयुक्त मोड का चयन किया जा सकता है:

```ts title="src/entry.node.ts"
const rc = await esmx.render({
    importmapMode: 'js',  // 'inline' | 'js'
    params: {
        url: req.url
    }
});
```

### एंट्री फंक्शन कॉन्फ़िगरेशन

RenderContext `entryName` कॉन्फ़िगरेशन के माध्यम से सर्वर-साइड रेंडरिंग के लिए एंट्री फंक्शन को निर्दिष्ट करने का समर्थन करता है:

```ts title="src/entry.node.ts"
const rc = await esmx.render({
    entryName: 'mobile',  // मोबाइल एंट्री फंक्शन का उपयोग करें
    params: {
        url: req.url
    }
});
```

यह मैकेनिज्म विशेष रूप से निम्नलिखित सीनारियो के लिए उपयोगी है:

1. **मल्टी-टेम्प्लेट रेंडरिंग**
   ```ts title="src/entry.server.ts"
   // मोबाइल एंट्री फंक्शन
   export const mobile = async (rc: RenderContext) => {
       // मोबाइल-स्पेसिफिक रेंडरिंग लॉजिक
   };

   // डेस्कटॉप एंट्री फंक्शन
   export const desktop = async (rc: RenderContext) => {
       // डेस्कटॉप-स्पेसिफिक रेंडरिंग लॉजिक
   };
   ```

2. **A/B