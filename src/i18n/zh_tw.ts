/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const i18n_zh_tw = {
  translation: {
    name: {
      IFI: '未來智能研究所',
      Aladdin: '阿拉丁',
    },

    cookie: {
      Statement: '聲明：為了改善您的用戶體驗，阿拉丁採用cookie儲存少量數據。',
      Accept: '同意',
    },

    aboutUs: {
      ProductBroughtToYouBy: '未來智能研究所榮譽出品',
      TermsOfService: '服務條款',
      PrivacyPolicy: '隱私政策',
      Software: '軟體',
      Content: '課件',
      Research: '研究',
      Support: '服務',
      Acknowledgment: '鳴謝',
      FundingInformation:
        '本產品的研發承蒙美國國家科學基金會慷慨資助（項目號#2105695和#2131097）。本產品的任何觀點或結論僅代表創作者個人意見。',
      Contact: '如您需要更多資訊，請聯繫 Charles Xie (charles@intofuture.org)。我們會盡快回复。',
      Translators: '翻譯',
    },

    word: {
      AllRightsReserved: '版權所有',
      MeterAbbreviation: '米',
      Version: '版本',
      Options: '選項',
      MaximumNumber: '最多',
      Or: '或',
      None: '無',
      Teacher: '老師',
      Class: '班級',
      Total: '總數',
      Range: '範圍',
      Press: '按',
      Open: '打開',
      Save: '保存',
      SaveAsImage: '保存為圖像',
      Update: '刷新',
      Paste: '粘貼',
      Copy: '複製',
      Cut: '剪切',
      Delete: '删除',
      Lock: '固定',
      Color: '顏色',
      Texture: '材質',
      Thickness: '厚度',
      Size: '尺寸',
      Yes: '要',
      No: '不要',
      OK: '確定',
      Cancel: '取消',
      Apply: '應用',
      Close: '關閉',
      ApplyTo: '適用於',
      Clear: '清空',
      Warning: '警告',
      Length: '長度',
      Width: '寬度',
      Height: '高度',
      Angle: '角度',
      Azimuth: '方位角',
      Weather: '天氣',
      Show: '顯示',
      Animate: '動畫',
      Date: '日期',
      Time: '時間',
      Title: '標題',
      Owner: '所有者',
      Action: '操作',
      Rename: '改名',
      Location: '位置',
      Latitude: '緯度',
      Month: '月',
      Day: '天',
      Hour: '小時',
      Daylight: '白天長度',
      Radiation: '輻射',
      Temperature: '温度',
      kWh: '千瓦時',
      NorthInitial: '北',
      SouthInitial: '南',
      EastInitial: '東',
      WestInitial: '西',
    },

    shared: {
      AzimuthOfNorthIsZero: '正北的方位角為零度',
      CounterclockwiseAzimuthIsPositive: '逆時針為正',
      NoTexture: '無材質',
      DoYouWantToSaveChanges: '您要保存當前文檔嗎？',
      NotApplicableToSelectedAction: '此值不適用於當前選擇範圍',
      ThisElementIsLocked: '這個部件被鎖定。',
      FoundationElement: '地基',
      CuboidElement: '長方體',
      PolygonElement: '多邊形',
      SensorElement: '傳感器',
      SolarPanelElement: '光伏板',
      ElementLocked: '固定',
      ThisCannotBeUndone: '這個操作一旦執行就不能撤銷。',
    },

    menu: {
      mainMenu: '主菜單',
      cloudMenu: '雲菜單',
      fileSubMenu: '文檔',
      file: {
        CreateNewFile: '創建新文檔',
        OpenLocalFile: '打開本地文檔',
        SaveAsLocalFile: '保存為本地文檔',
        SavingAbortedMustHaveValidFileName: '文檔名無效，保存失敗',
        OpenCloudFile: '打開雲端文檔',
        SaveCloudFile: '保存雲端文檔',
        SaveAsCloudFile: '保存為雲端文檔',
        SavingAbortedMustHaveValidTitle: '雲端文檔名無效，保存失敗',
        ToSaveYourWorkPleaseSignIn: '為了保存您的雲端文檔，請您先登錄。',
        TakeScreenshot: '截屏',
      },
      editSubMenu: '編輯',
      edit: {
        Undo: '撤銷',
        Redo: '重做',
      },
      viewSubMenu: '視界',
      view: {
        TwoDimensionalView: '二維模式',
        ResetView: '重置視角',
        ZoomIn: '放大',
        ZoomOut: '縮小',
        AutoRotate: '自動旋轉',
        SiteInformation: '位置資訊',
        DesignInformation: '設計資訊',
        Instruction: '操作說明',
        StickyNote: '便簽',
        ShowShadow: '顯示陰影',
      },
      toolSubMenu: '工具',
      tool: {
        Map: '地圖',
        WeatherData: '氣象數據',
        Heliodon: '日影儀',
      },
      analysisSubMenu: '分析',
      sensorsSubMenu: '傳感器',
      sensors: {
        CollectDailyData: '收集當天數據',
        CollectYearlyData: '收集全年數據',
        SamplingFrequency: '採樣頻率',
        TimesPerHour: '每小時次數',
      },
      solarPanelsSubMenu: '太陽能光伏板',
      solarPanels: {
        AnalyzeDailyYield: '分析當天產出',
        AnalyzeYearlyYield: '分析全年產出',
        PanelDiscretization: '光伏板離散化方法',
        Exact: '準確',
        Approximate: '近似',
      },
      examplesSubMenu: '例子',
      solarEnergySubMenu: '太陽能',
      buildingsSubMenu: '建築物',
      examples: {
        SunAngles: '太陽相對於地面觀察者的角度',
        SolarRadiationToBox: '一個長方體受到的太陽能輻射分析',
        SunBeamAndHeliodon: '太陽光束和日影儀',
        SolarFarm: '太陽能農場',
        SolarFarmInRealWorld: '模擬一個真實世界裡的太陽能農場',
        SolarTrackers: '自動追日器',
        SolarTrackersInRealWorld: '模擬一個真實世界裡的追日光伏板陣列',
        SimpleHouse: '一棟簡單的房屋',
        OfficeBuilding: '一棟簡單的寫字樓',
        Hotel: '一個旅館場景',
      },
      languageSubMenu: '語言',
      AboutUs: '關於我們',
    },

    avatarMenu: {
      AccountSettings: '賬號設定',
      SignIn: '登錄',
      SignOut: '退出賬號',
      IfYouAreAStudent: '如果您是一個學生',
    },

    skyMenu: {
      Axes: '顯示坐標軸',
      Theme: '環境主題',
      ThemeDefault: '默認',
      ThemeDesert: '沙漠',
      ThemeForest: '森林',
      ThemeGrassland: '草原',
    },

    groundMenu: {
      Albedo: '反照率',
      ImageOnGround: '地面顯示圖像',
      RemoveAllTrees: '刪除所有的樹木',
      RemoveAllPeople: '删除所有的人物',
      RemoveAllFoundations: '删除所有的地基',
      RemoveAllCuboids: '删除所有的長方體',
      DoYouReallyWantToRemoveAllPeople: '你確定刪除所有的人物嗎',
      DoYouReallyWantToRemoveAllTrees: '你確定刪除所有的樹木嗎',
      DoYouReallyWantToRemoveAllFoundations: '你確定刪除所有的地基嗎',
      DoYouReallyWantToRemoveAllCuboids: '你確定刪除所有的長方體嗎',
    },

    foundationMenu: {
      RemoveAllSolarPanels: '刪除此地基上所有的光伏板',
      RemoveAllSensors: '刪除此地基上所有的傳感器',
      RemoveAllWalls: '刪除此地基上所有的牆',
      RemoveAllPolygons: '刪除此地基上所有的多邊形',
      Racks: '支架',
      Texture01: '一號材質',
      Texture02: '二號材質',
      Texture03: '三號材質',
      Texture04: '四號材質',
      Texture05: '五號材質',
      Texture06: '六號材質',
      Texture07: '七號材質',
      Texture08: '八號材質',
      Texture09: '九號材質',
      Texture10: '十號材質',
      SolarPanels: '光伏板',
      DoYouReallyWantToRemoveAllSolarPanelsOnFoundation: '你確定刪除此地基上所有的光伏板嗎',
      Sensors: '傳感器',
      DoYouReallyWantToRemoveAllSensorsOnFoundation: '你確定刪除此地基上所有的傳感器嗎',
      Walls: '牆',
      DoYouReallyWantToRemoveAllWallsOnFoundation: '你確定刪除此地基上所有的牆嗎',
      Polygons: '多邊形',
      DoYouReallyWantToRemoveAllPolygonsOnFoundation: '你確定刪除此地基上所有的多邊形嗎',
      OnlyThisFoundation: '只這塊地基',
      AllConnectedFoundations: '所有相連的地基',
      AllFoundations: '所有的地基',
      AddPolygon: '添加多邊形',
    },

    cuboidMenu: {
      Texture01: '一號材質',
      Texture02: '二號材質',
      Texture03: '三號材質',
      Texture04: '四號材質',
      Texture05: '五號材質',
      Texture06: '六號材質',
      Texture07: '七號材質',
      Texture08: '八號材質',
      Texture09: '九號材質',
      Texture10: '十號材質',
      RemoveAllSolarPanels: '刪除此長方體表面上所有的光伏板',
      RemoveAllSensors: '刪除此長方體表面上所有的傳感器',
      RemoveAllPolygons: '刪除此長方體表面上所有的多邊形',
      Racks: '支架',
      SolarPanels: '光伏板',
      DoYouReallyWantToRemoveAllSolarPanelsOnCuboid: '你確定刪除此長方體表面上所有的光伏板嗎',
      Sensors: '傳感器',
      DoYouReallyWantToRemoveAllSensorsOnCuboid: '你確定刪除此長方體表面上所有的傳感器嗎',
      Polygons: '多邊形',
      DoYouReallyWantToRemoveAllPolygonsOnCuboid: '你確定刪除此長方體表面上所有的多邊形嗎',
      OnlyThisCuboid: '只這個長方體',
      AllCuboids: '所有的長方體',
      OnlyThisSide: '只這個表面',
      AllSidesOfThisCuboid: '這個長方體所有的側面',
      AllSidesOfAllCuboids: '所有的長方體所有的側面',
      AddPolygon: '添加多邊形',
    },

    polygonMenu: {
      Texture01: '一號材質',
      Texture02: '二號材質',
      Texture03: '三號材質',
      Texture04: '四號材質',
      Texture05: '五號材質',
      Texture06: '六號材質',
      Texture07: '七號材質',
      Texture08: '八號材質',
      Texture09: '九號材質',
      Texture10: '十號材質',
      Filled: '填充',
      FillColor: '填充顏色',
      LineColor: '線條顏色',
      InsertVertexBeforeIndex: '前面插入頂點',
      InsertVertexAfterIndex: '後面插入頂點',
      DeleteVertex: '移除頂點',
      OnlyThisPolygon: '只這個多邊形',
      AllPolygonsOnSurface: '同一表面上所有的多邊形',
      AllPolygonsAboveFoundation: '同一地基上所有的多邊形',
      AllPolygons: '所有的多邊形',
    },

    treeMenu: {
      ShowModel: '顯示近似模型',
      Type: '樹種',
      Spread: '樹冠直徑',
    },

    peopleMenu: {
      ChangePerson: '改變人物',
    },

    sensorMenu: {
      Label: '標籤',
      KeepShowingLabel: '顯示標籤',
    },

    solarPanelMenu: {
      ChangePvModel: '改變光伏板型號',
      Orientation: '排列方向',
      Portrait: '縱向',
      Landscape: '橫向',
      Panels: '塊',
      PanelsWide: '塊光伏板寬',
      PanelsLong: '塊光伏板長',
      TiltAngle: '傾斜角度',
      SouthFacingIsPositive: '朝南為正',
      RelativeAzimuth: '相對方位角',
      Tracker: '追日系統',
      SolarTrackerFollowsSun: '追日系統提高光伏板產出。',
      PoleHeight: '支架高度',
      PoleSpacing: '支柱間隔',
      DrawSunBeam: '顯示光束',
      Label: '標籤',
      KeepShowingLabel: '顯示標籤',
      NoTracker: '無追日系統',
      HorizontalSingleAxisTracker: '水平單軸追日系統',
      VerticalSingleAxisTracker: '豎直單軸追日系統',
      AltazimuthDualAxisTracker: '地平雙軸追日系統',
      OnlyThisSolarPanel: '只這個光伏板',
      AllSolarPanelsOnSurface: '同一表面上所有的光伏板',
      AllSolarPanelsAboveFoundation: '同一地基上所有的光伏板',
      AllSolarPanels: '所有的光伏板',
    },

    pvModelPanel: {
      SolarPanelSpecs: '光伏板型號性能',
      Model: '型號',
      PanelSize: '尺寸',
      Cells: '電池組',
      CellType: '光伏電池類型',
      Monocrystalline: '單晶矽',
      Polycrystalline: '多晶矽',
      ThinFilm: '薄膜',
      Black: '黑色',
      Blue: '藍色',
      ShadeTolerance: '陰影耐受度',
      SolarCellEfficiency: '光伏電池效率',
      NominalOperatingCellTemperature: '名義電池運行溫度',
      TemperatureCoefficientOfPmax: 'Pmax溫度係數',
    },

    wallMenu: {
      TextureDefault: '默認材質',
      Texture01: '一號材質',
      Texture02: '二號材質',
      Texture03: '三號材質',
      Texture04: '四號材質',
      Texture05: '五號材質',
      Texture06: '六號材質',
      Texture07: '七號材質',
      Texture08: '八號材質',
      Texture09: '九號材質',
      Texture10: '十號材質',
      SizeOfWall: '牆的尺寸',
      OnlyThisWall: '只這堵牆',
      AllWallsAboveFoundation: '同一地基上所有的牆',
      AllWalls: '所有的牆',
    },

    windowMenu: {},

    siteInfoPanel: {
      High: '最高溫度',
      Low: '最低温度',
    },

    designInfoPanel: {
      ClickToRecountSolarPanels: '點擊此處重新計算光伏板總數',
      SceneRadius: '場景半徑',
    },

    instructionPanel: {
      Rotate: '旋轉',
      DragMouse: '拖動滑鼠',
      Zoom: '缩放',
      MouseWheelOrKeys: '滑鼠滾輪或者Ctrl+[和Ctrl+]',
      Pan: '平移',
      HoldCtrlDragMouse: '按下Ctrl鍵並拖動滑鼠',
      Toggle2D3D: '二維/三維切换',
      ResetView: '重置視角',
      AutoRotate: '自動旋轉',
      StartOrStop: '按F4鍵啟動或停止',
    },

    mapPanel: {
      ImageOnGround: '地面顯示圖像',
      StationsOnMap: '顯示氣象站位置',
      Coordinates: '經緯度坐標',
      Zoom: '放大程度',
    },

    sensorPanel: {
      LightSensor: '光傳感器',
      WeatherDataFrom: '氣象數據來自',
    },

    solarPanelYieldPanel: {
      SolarPanelDailyYield: '光伏日發電量',
      SolarPanelYearlyYield: '光伏年發電量',
      Yield: '發電量',
      YieldPerHour: '每小時發電量',
      DailyTotal: '日發電總量',
      YearlyTotal: '年發電總量',
      HoverForBreakdown: '在此停留滑鼠分列發電量',
      ShowOutputsOfIndividualSolarPanels: '顯示每個光伏單位單獨發電量',
    },

    heliodonPanel: {
      HeliodonSettings: '日影儀設置',
      SunAngles: '角度',
    },

    cloudFilePanel: {
      MyCloudFiles: '我的雲文件',
      GenerateLink: '生成鏈接',
      LinkGeneratedInClipBoard: '鏈接已經復製到剪貼板',
      DoYouReallyWantToDelete: '您確定刪除此文檔',
    },

    accountSettingsPanel: {
      MyAccountSettings: '我的賬戶設定',
    },

    weatherPanel: {
      SunshineHours: '日照時間',
    },

    yearlyLightSensorPanel: {
      SkyClearness: '天空清晰度',
      ShowDaylightResults: '顯示日照時間結果',
      ShowSkyClearnessResults: '顯示天空清晰度結果',
      ShowAverageDailySolarRadiation: '顯示日平均輻射結果',
    },

    analysisManager: {
      NoSensorForCollectingData: '沒有傳感器收集數據。',
      NoSolarPanelForAnalysis: '沒有光伏板可以分析。',
    },

    toolbar: {
      CloudFile: '雲文檔',
      Select: '選擇',
      AddFoundation: '添加地基',
      AddWall: '添加牆體',
      AddWindow: '添加窗戶',
      AddRoof: '添加屋頂',
      AddCuboid: '添加長方體',
      AddSensor: '添加傳感器',
      AddSolarPanel: '添加光伏板',
      AddTree: '添加樹木',
      AddPeople: '添加人物',
      ClearScene: '清空場景',
      ShowHeliodonPanel: '顯示日影儀面板',
      ShowShadow: '顯示陰影',
      DoYouReallyWantToClearContent: '您確定清空場景嗎',
    },

    tooltip: {
      gotoIFI: '訪問未來智能研究所',
      visitAladdinHomePage: '訪問阿拉丁主頁',
      clickToOpenMenu: '點擊打開主菜單',
      clickToAccessCloudTools: '點擊打開雲菜單',
    },

    tree: {
      Cottonwood: '白楊',
      Dogwood: '茱萸',
      Elm: '榆樹',
      Linden: '菩提樹',
      Maple: '楓樹',
      Oak: '橡樹',
      Pine: '松樹',
    },

    people: {
      Jack: '傑克',
      Jade: '美玉',
      Jane: '簡',
      Jaye: '傑伊',
      Jean: '吉恩',
      Jedi: '傑迪',
      Jeff: '傑夫',
      Jena: '珍娜',
      Jeni: '詹尼',
      Jess: '傑西',
      Jett: '傑特',
      Jill: '吉爾',
      Joan: '瓊',
      Joel: '喬爾',
      John: '約翰',
      Jose: '何塞',
      Judd: '賈德',
      Judy: '朱蒂',
      June: '準衛',
      Juro: '朱諾',
      Xiaoli: '小麗',
      Xiaoming: '小明',
    },
  },
};
