const caseIDs = {
  case1: '69784',
  case2: '69785',
  case3: '69786',
  case4: '69787'
};

const testData = {
  cat1: {
    expectedText1: 'Application',
    expectedText2: 'Alert อัพเดทเวอร์ชันแอปพลิเคชัน',
    description: 'Category 1 - Application Alert'
  },
  cat2: {
    expectedText1: 'Bug Report',
    expectedText2: 'Critical Issue Found',
    description: 'Category 2 - Bug Report'
  },
  cat3: {
    expectedText1: 'Feature Request',
    expectedText2: 'New Feature Implementation',
    description: 'Category 3 - Feature'
  },
  cat4: {
    expectedText1: 'Support Ticket',
    expectedText2: 'User Support Question',
    description: 'Category 4 - Support'
  }
};

const cookieString = "SPR_STICKINESS=1774839321.736.823.359102|935c7dcb81a00314ea56a3b1f4989107; JSESSIONID=8B93717C094334CF8EF94C027C7E12D6; _mkto_trk=id:386-OOV-110&token:_mch-sprinklr.com-5ea07ccc3f545f7cd13fa0258bbfeff; __adroll_fpc=989f38c5382e312550ef9ffef04152af-1774423694298; user.env.type=ENTERPRISE; connect.sid=s%3AX6xMKgTyG5O01EClZYIB6luSmK09WhNJ.s3FVRzqe72FBPd9do74RbeLM9c6VLitMWclLeVaOddM; SPR_AT=Z0s0RjJ6emJDb0dVTW1qaEpDbjZ5; connect.token=eyJ2M1Nlc3Npb25VcGRhdGVkIjoidHJ1ZSIsImFjY2Vzc1Rva2VuIjoiZXlKaGJHY2lPaUpTVXpJMU5pSjkuZXlKemRXS";

module.exports = { caseIDs, testData, cookieString };






