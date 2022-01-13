/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

export const i18n_zh_cn = {
  translation: {
    name: {
      IFI: '未来智能研究所',
      Aladdin: '阿拉丁',
    },

    cookie: {
      Statement: '声明：为了改善您的用户体验，阿拉丁采用cookie储存少量数据。',
      Accept: '同意',
    },

    aboutUs: {
      ProductBroughtToYouBy: '未来智能研究所荣誉出品',
      TermsOfService: '服务条款',
      PrivacyPolicy: '隐私政策',
      Software: '软件',
      Content: '课件',
      Research: '研究',
      Support: '服务',
      Acknowledgment: '鸣谢',
      FundingInformation:
        '本产品的研发承蒙美国国家科学基金会慷慨资助（项目号#2105695和#2131097）。本产品的任何观点或结论仅代表创作者个人意见。',
      Contact: '如您需要更多信息，请联系 Charles Xie (charles@intofuture.org)。我们会尽快回复。',
      Translators: '翻译',
    },

    word: {
      AllRightsReserved: '版权所有',
      MeterAbbreviation: '米',
      Version: '版本',
      Options: '选项',
      MaximumNumber: '最多',
      Or: '或',
      None: '无',
      Teacher: '老师',
      Class: '班级',
      Total: '总数',
      Range: '范围',
      Press: '按',
      Open: '打开',
      Save: '保存',
      SaveAsImage: '保存为图像',
      Update: '刷新',
      Paste: '粘贴',
      Copy: '复制',
      Cut: '剪切',
      Delete: '删除',
      Lock: '固定',
      Color: '颜色',
      Texture: '材质',
      Thickness: '厚度',
      Size: '尺寸',
      Yes: '要',
      No: '不要',
      OK: '确定',
      Cancel: '取消',
      Apply: '应用',
      Close: '关闭',
      ApplyTo: '适用于',
      Clear: '清空',
      Warning: '警告',
      Reminder: '提醒',
      Length: '长度',
      Width: '宽度',
      Height: '高度',
      Angle: '角度',
      Azimuth: '方位角',
      Weather: '天气',
      Show: '显示',
      Animate: '动画',
      Date: '日期',
      Time: '时间',
      Title: '标题',
      Owner: '所有者',
      Action: '操作',
      Rename: '改名',
      Location: '位置',
      Latitude: '纬度',
      Month: '月',
      Day: '天',
      Hour: '小时',
      Daylight: '白天长度',
      Radiation: '辐射',
      Temperature: '温度',
      kWh: '千瓦时',
      NorthInitial: '北',
      SouthInitial: '南',
      EastInitial: '东',
      WestInitial: '西',
    },

    shared: {
      NoTexture: '无材质',
      FoundationElement: '地基',
      CuboidElement: '长方体',
      PolygonElement: '多边形',
      SensorElement: '传感器',
      SolarPanelElement: '光伏板',
      ElementLocked: '固定',
    },

    message: {
      CannotSignIn: '登录失败',
      CannotSignOut: '退出失败',
      YourAccountWasCreated: '成功建立您的账号。',
      CannotCreateAccount: '无法创建账号',
      YourAccountSettingsWereSaved: '您的账号设定已保存。',
      CannotSaveYourAccountSettings: '您的账号设定无法保存',
      CannotSaveYourFileToCloud: '无法保存您的文件到云端',
      CloudFileNotFound: '找不到此云端文件',
      CannotOpenCloudFile: '此云端文件无法打开',
      CannotOpenCloudFolder: '您的云端文件夹无法打开',
      CannotDeleteCloudFile: '无法删除此云端文件',
      CannotRenameCloudFile: '此云端文件的名字无法更改',
      DoYouWantToSaveChanges: '您要保存当前文件吗？',
      NotApplicableToSelectedAction: '此值不适用于当前选择范围',
      ThisElementIsLocked: '这个部件被锁定。',
      ThisCannotBeUndone: '这个操作一旦执行就不能撤销。',
      AzimuthOfNorthIsZero: '正北的方位角为零度',
      CounterclockwiseAzimuthIsPositive: '逆时针为正',
      MoveCancelledBecauseOfOverlap: '位置重叠，移动取消。',
      MoveOutsideBoundaryCancelled: '位置出界，移动取消。',
      RotationCancelledBecauseOfOverlap: '位置重叠，旋转取消。',
      RotationOutsideBoundaryCancelled: '位置出界，旋转取消。',
      ResizingCancelledBecauseOfOverlap: '位置重叠，尺寸调整取消。',
      ResizingOutsideBoundaryCancelled: '位置出界，尺寸调整取消。',
      CannotPasteOutsideBoundary: '位置出界，不能复制。',
      CannotPasteBecauseOfOverlap: '位置重叠，不能复制。',
      CannotMoveObjectTooFar: '位置太远，移动取消。',
      ExistingSolarPanelsWillBeRemovedBeforeApplyingNewLayout: '采用新布局之前必须移除现有的光伏板。',
      DoYouWantToContinue: '您想继续吗？',
      SolarPanelsCannotIntersectWithGround: '光伏板不能和地面接触。',
      SolarPanelsCannotOverlapWithOneAnother: '光伏板不能重叠。',
    },

    menu: {
      mainMenu: '主菜单',
      cloudMenu: '云菜单',
      fileSubMenu: '文件',
      file: {
        CreateNewFile: '创建新文件',
        OpenLocalFile: '打开本地文件',
        SaveAsLocalFile: '保存为本地文件',
        SavingAbortedMustHaveValidFileName: '文件名无效，保存失败',
        OpenCloudFile: '打开云端文件',
        SaveCloudFile: '保存云端文件',
        SaveAsCloudFile: '保存为云端文件',
        SavingAbortedMustHaveValidTitle: '云端文件名无效，保存失败',
        ToSaveYourWorkPleaseSignIn: '为了保存您的云端文件，请您先登录。',
        TakeScreenshot: '截屏',
      },
      editSubMenu: '编辑',
      edit: {
        Undo: '撤销',
        Redo: '重做',
      },
      viewSubMenu: '视界',
      view: {
        TwoDimensionalView: '二维模式',
        ResetView: '重置视角',
        ZoomIn: '放大',
        ZoomOut: '缩小',
        AutoRotate: '自动旋转',
        SiteInformation: '位置信息',
        DesignInformation: '设计信息',
        Instruction: '操作说明',
        StickyNote: '便签',
        ShowShadow: '显示阴影',
      },
      toolSubMenu: '工具',
      tool: {
        Map: '地图',
        WeatherData: '气象数据',
        Heliodon: '日影仪',
        SunAndTime: '太阳和时间',
      },
      analysisSubMenu: '分析',
      sensorsSubMenu: '传感器',
      sensors: {
        CollectDailyData: '收集当天数据',
        CollectYearlyData: '收集全年数据',
        SamplingFrequency: '采样频率',
        TimesPerHour: '每小时次数',
      },
      solarPanelsSubMenu: '太阳能光伏板',
      solarPanels: {
        AnalyzeDailyYield: '分析当天产出',
        AnalyzeYearlyYield: '分析全年产出',
        PanelDiscretization: '光伏板离散化方法',
        Exact: '准确',
        Approximate: '近似',
      },
      examplesSubMenu: '例子',
      solarEnergySubMenu: '太阳能',
      buildingsSubMenu: '建筑物',
      examples: {
        SunAngles: '太阳相对于地面观察者的角度',
        SolarRadiationToBox: '一个长方体受到的太阳能辐射分析',
        SunBeamAndHeliodon: '太阳光束和日影仪',
        SolarFarm: '太阳能农场',
        SolarFarmInRealWorld: '模拟一个真实世界里的太阳能农场',
        SolarTrackers: '自动追日器',
        SolarTrackersInRealWorld: '模拟一个真实世界里的追日光伏板阵列',
        SimpleHouse: '一栋简单的房屋',
        OfficeBuilding: '一栋简单的办公楼',
        Hotel: '一个旅馆场景',
      },
      languageSubMenu: '语言',
      AboutUs: '关于我们',
    },

    avatarMenu: {
      AccountSettings: '账号设定',
      SignIn: '登录',
      SignOut: '退出账号',
      IfYouAreAStudent: '如果您是一个学生',
    },

    skyMenu: {
      Axes: '显示坐标轴',
      Theme: '环境主题',
      ThemeDefault: '默认',
      ThemeDesert: '沙漠',
      ThemeForest: '森林',
      ThemeGrassland: '草原',
    },

    groundMenu: {
      Albedo: '反照率',
      ImageOnGround: '地面显示图像',
      RemoveAllTrees: '删除所有的树木',
      RemoveAllPeople: '删除所有的人物',
      RemoveAllFoundations: '删除所有的地基',
      RemoveAllCuboids: '删除所有的长方体',
      DoYouReallyWantToRemoveAllPeople: '你确定删除所有的人物吗',
      DoYouReallyWantToRemoveAllTrees: '你确定删除所有的树木吗',
      DoYouReallyWantToRemoveAllFoundations: '你确定删除所有的地基吗',
      DoYouReallyWantToRemoveAllCuboids: '你确定删除所有的长方体吗',
    },

    foundationMenu: {
      RemoveAllSolarPanels: '删除此地基上所有的光伏板',
      RemoveAllSensors: '删除此地基上所有的传感器',
      RemoveAllWalls: '删除此地基上所有的墙',
      RemoveAllPolygons: '删除此地基上所有的多边形',
      RemoveAllHumans: '删除此地基上所有的人物',
      RemoveAllTrees: '删除此地基上所有的树木',
      Racks: '支架',
      Texture01: '一号材质',
      Texture02: '二号材质',
      Texture03: '三号材质',
      Texture04: '四号材质',
      Texture05: '五号材质',
      Texture06: '六号材质',
      Texture07: '七号材质',
      Texture08: '八号材质',
      Texture09: '九号材质',
      Texture10: '十号材质',
      SolarPanels: '光伏板',
      DoYouReallyWantToRemoveAllSolarPanelsOnFoundation: '你确定删除此地基上所有的光伏板吗',
      Sensors: '传感器',
      DoYouReallyWantToRemoveAllSensorsOnFoundation: '你确定删除此地基上所有的传感器吗',
      Walls: '墙',
      DoYouReallyWantToRemoveAllWallsOnFoundation: '你确定删除此地基上所有的墙吗',
      Polygons: '多边形',
      DoYouReallyWantToRemoveAllPolygonsOnFoundation: '你确定删除此地基上所有的多边形吗',
      Humans: '人物',
      DoYouReallyWantToRemoveAllHumansOnFoundation: '你确定删除此地基上所有的人物吗',
      Trees: '树木',
      DoYouReallyWantToRemoveAllTreesOnFoundation: '你确定删除此地基上所有的树木吗',
      OnlyThisFoundation: '只这块地基',
      AllConnectedFoundations: '所有相连的地基',
      AllFoundations: '所有的地基',
      AddPolygon: '添加多边形',
    },

    cuboidMenu: {
      Texture01: '一号材质',
      Texture02: '二号材质',
      Texture03: '三号材质',
      Texture04: '四号材质',
      Texture05: '五号材质',
      Texture06: '六号材质',
      Texture07: '七号材质',
      Texture08: '八号材质',
      Texture09: '九号材质',
      Texture10: '十号材质',
      RemoveAllSolarPanels: '删除此长方体表面上所有的光伏板',
      RemoveAllSensors: '删除此长方体表面上所有的传感器',
      RemoveAllPolygons: '删除此长方体表面上所有的多边形',
      RemoveAllHumans: '删除此长方体表面上所有的人物',
      RemoveAllTrees: '删除此长方体表面上所有的树木',
      Racks: '支架',
      SolarPanels: '光伏板',
      DoYouReallyWantToRemoveAllSolarPanelsOnCuboid: '你确定删除此长方体表面上所有的光伏板吗',
      Sensors: '传感器',
      DoYouReallyWantToRemoveAllSensorsOnCuboid: '你确定删除此长方体表面上所有的传感器吗',
      Polygons: '多边形',
      DoYouReallyWantToRemoveAllPolygonsOnCuboid: '你确定删除此长方体表面上所有的多边形吗',
      Humans: '人物',
      DoYouReallyWantToRemoveAllHumansOnCuboid: '你确定删除此长方体表面上所有的人物吗',
      Trees: '树木',
      DoYouReallyWantToRemoveAllTreesOnCuboid: '你确定删除此长方体表面上所有的树木吗',
      OnlyThisCuboid: '只这个长方体',
      AllCuboids: '所有的长方体',
      OnlyThisSide: '只这个表面',
      AllSidesOfThisCuboid: '这个长方体所有的侧面',
      AllSidesOfAllCuboids: '所有的长方体所有的侧面',
      AddPolygon: '添加多边形',
    },

    polygonMenu: {
      Texture01: '一号材质',
      Texture02: '二号材质',
      Texture03: '三号材质',
      Texture04: '四号材质',
      Texture05: '五号材质',
      Texture06: '六号材质',
      Texture07: '七号材质',
      Texture08: '八号材质',
      Texture09: '九号材质',
      Texture10: '十号材质',
      Filled: '填充',
      FillTexture: '填充材质',
      FillColor: '填充颜色',
      LineColor: '线条颜色',
      LineStyle: '线条样式',
      SolidLine: '实线',
      DashedLine: '虚线',
      DottedLine: '点线',
      InsertVertexBeforeIndex: '前面插入顶点',
      InsertVertexAfterIndex: '后面插入顶点',
      DeleteVertex: '移除顶点',
      OnlyThisPolygon: '只这个多边形',
      AllPolygonsOnSurface: '同一表面上所有的多边形',
      AllPolygonsAboveFoundation: '同一地基上所有的多边形',
      AllPolygons: '所有的多边形',
      Layout: '布局',
      SolarPanelArrayLayout: '光伏板阵列布局',
      SolarPanelArrayLayoutParametricDesign: '光伏板阵列布局参数化设计',
      SolarPanelArrayModel: '光伏板型号',
      SolarPanelArrayOrientation: '排列方向',
      SolarPanelArrayTiltAngle: '倾斜角度',
      SolarPanelArrayRowWidth: '行宽度',
      SolarPanelArrayInterRowSpacing: '行间距',
      SolarPanelArrayRowAxis: '行轴方向',
      SolarPanelArrayZonalRowAxis: '纬线方向(东西向)',
      SolarPanelArrayMeridionalRowAxis: '经线方向(南北向)',
      SolarPanelArrayPoleHeight: '支架高度',
      SolarPanelArrayPoleSpacing: '支柱间隔',
      LayoutNotAcceptedCheckYourParameters: '恕不能采用此布局。请检查您的参数设置。',
    },

    treeMenu: {
      ShowModel: '显示近似模型',
      Type: '树种',
      Spread: '树冠直径',
    },

    peopleMenu: {
      ChangePerson: '改变人物',
    },

    sensorMenu: {
      Label: '标签',
      KeepShowingLabel: '显示标签',
    },

    solarPanelMenu: {
      ChangePvModel: '改变光伏板型号',
      Orientation: '排列方向',
      Portrait: '纵向',
      Landscape: '橫向',
      Panels: '块',
      PanelsWide: '块光伏板宽',
      PanelsLong: '块光伏板长',
      TiltAngle: '倾斜角度',
      SouthFacingIsPositive: '朝南为正',
      RelativeAzimuth: '相对方位角',
      Tracker: '追日系统',
      SolarTrackerFollowsSun: '追日系统提高光伏板产出。',
      PoleHeight: '支架高度',
      PoleSpacing: '支柱间隔',
      DrawSunBeam: '显示光束',
      Label: '标签',
      KeepShowingLabel: '显示标签',
      NoTracker: '无追日系统',
      HorizontalSingleAxisTracker: '水平单轴追日系统',
      VerticalSingleAxisTracker: '竖直单轴追日系统',
      AltazimuthDualAxisTracker: '地平双轴追日系统',
      OnlyThisSolarPanel: '只这个光伏板',
      AllSolarPanelsOnSurface: '同一表面上所有的光伏板',
      AllSolarPanelsAboveFoundation: '同一地基上所有的光伏板',
      AllSolarPanels: '所有的光伏板',
    },

    pvModelPanel: {
      SolarPanelSpecs: '光伏板型号性能',
      Model: '型号',
      PanelSize: '尺寸',
      Cells: '电池組',
      CellType: '光伏电池类型',
      Monocrystalline: '单晶硅',
      Polycrystalline: '多晶硅',
      ThinFilm: '薄膜',
      Black: '黑色',
      Blue: '蓝色',
      ShadeTolerance: '阴影耐受度',
      SolarCellEfficiency: '光伏电池效率',
      NominalOperatingCellTemperature: '名义电池运行温度',
      TemperatureCoefficientOfPmax: 'Pmax温度系数',
    },

    wallMenu: {
      TextureDefault: '默认材质',
      Texture01: '一号材质',
      Texture02: '二号材质',
      Texture03: '三号材质',
      Texture04: '四号材质',
      Texture05: '五号材质',
      Texture06: '六号材质',
      Texture07: '七号材质',
      Texture08: '八号材质',
      Texture09: '九号材质',
      Texture10: '十号材质',
      SizeOfWall: '墙的尺寸',
      OnlyThisWall: '只这堵墙',
      AllWallsAboveFoundation: '同一地基上所有的墙',
      AllWalls: '所有的墙',
    },

    windowMenu: {},

    siteInfoPanel: {
      High: '最高温度',
      Low: '最低温度',
    },

    designInfoPanel: {
      ClickToRecountSolarPanels: '点击此处重新计算光伏板总数',
      SceneRadius: '场景半径',
    },

    instructionPanel: {
      Rotate: '旋转',
      DragMouse: '拖动鼠标',
      Zoom: '缩放',
      MouseWheelOrKeys: '鼠标滚轮或者Ctrl+[和Ctrl+]',
      Pan: '平移',
      HoldCtrlDragMouse: '按下Ctrl键并拖动鼠标',
      Toggle2D3D: '二维/三维切换',
      ResetView: '重置视角',
      AutoRotate: '自动旋转',
      StartOrStop: '按F4键启动或停止',
    },

    mapPanel: {
      ImageOnGround: '地面显示图像',
      StationsOnMap: '显示气象站位置',
      Coordinates: '经纬度坐标',
      Zoom: '放大程度',
    },

    sensorPanel: {
      LightSensor: '光传感器',
      WeatherDataFrom: '气象数据来自',
    },

    solarPanelYieldPanel: {
      SolarPanelDailyYield: '光伏日发电量',
      SolarPanelYearlyYield: '光伏年发电量',
      Yield: '发电量',
      YieldPerHour: '每小时发电量',
      DailyTotal: '日发电总量',
      YearlyTotal: '年发电总量',
      HoverForBreakdown: '在此停留鼠标分列发电量',
      ShowOutputsOfIndividualSolarPanels: '显示每个光伏单位单独发电量',
    },

    heliodonPanel: {
      SunAndTimeSettings: '太阳和时间设置',
      SunAngles: '角度',
    },

    cloudFilePanel: {
      MyCloudFiles: '我的云文件',
      GenerateLink: '生成链接',
      LinkGeneratedInClipBoard: '链接已经复制到剪贴板',
      DoYouReallyWantToDelete: '您确定删除此文件',
    },

    accountSettingsPanel: {
      MyAccountSettings: '我的账户设定',
      MyID: '我的ID',
      IDInClipBoard: '您现在可以粘贴ID了。',
      StoreMyNameInMyFilesWhenSaving: '保存文件时签上我的大名',
    },

    weatherPanel: {
      SunshineHours: '日照时间',
    },

    yearlyLightSensorPanel: {
      SkyClearness: '天空清晰度',
      ShowDaylightResults: '显示日照时间结果',
      ShowSkyClearnessResults: '显示天空清晰度结果',
      ShowAverageDailySolarRadiation: '显示日平均辐射结果',
    },

    analysisManager: {
      NoSensorForCollectingData: '没有传感器收集数据。',
      NoSolarPanelForAnalysis: '没有光伏板可以分析。',
    },

    toolbar: {
      CloudFile: '云文件',
      Select: '选择',
      AddFoundation: '添加地基',
      AddWall: '添加墙体',
      AddWindow: '添加窗户',
      AddRoof: '添加屋顶',
      AddCuboid: '添加长方体',
      AddSensor: '添加传感器',
      AddSolarPanel: '添加光伏板',
      AddTree: '添加树木',
      AddPeople: '添加人物',
      ClearScene: '清空场景',
      ShowSunAndTimeSettings: '显示太阳和时间设置',
      ShowShadow: '显示阴影',
      DoYouReallyWantToClearContent: '您确定清空场景吗',
    },

    tooltip: {
      gotoIFI: '访问未来智能研究所',
      visitAladdinHomePage: '访问阿拉丁主页',
      clickToOpenMenu: '点击打开主菜单',
      clickToAccessCloudTools: '点击打开云菜单',
    },

    tree: {
      Cottonwood: '白杨',
      Dogwood: '茱萸',
      Elm: '榆树',
      Linden: '菩提树',
      Maple: '枫树',
      Oak: '橡树',
      Pine: '松树',
    },

    people: {
      Jack: '杰克',
      Jade: '美玉',
      Jane: '简',
      Jaye: '杰伊',
      Jean: '吉恩',
      Jedi: '杰迪',
      Jeff: '杰夫',
      Jena: '珍娜',
      Jeni: '詹尼',
      Jess: '杰西',
      Jett: '杰特',
      Jill: '吉尔',
      Joan: '琼',
      Joel: '乔尔',
      John: '约翰',
      Jose: '何塞',
      Judd: '贾德',
      Judy: '朱蒂',
      June: '准卫',
      Juro: '朱诺',
      Xiaoli: '小丽',
      Xiaoming: '小明',
    },
  },
};
