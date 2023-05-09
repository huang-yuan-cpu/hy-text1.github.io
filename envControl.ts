import { defineStore } from 'pinia';
import {
  getIotComboBox,
  // getProjectList,
  // getTemperatureList,
  // getHumidityList,
  // getVentList,
  // getCO2List,
  // getAlarmList,
  getLivestockOnHand,
  getLowHighTemp,
  getCurrentTemperature,
  getCurrentHumidity,
  getCurrentCO2,
  getCurrentDraughtFan,
  getVentGuage,
  getUnitVent,
  getDeviceNumList,
  getDailyList,
  // getTemperatureLine,
  // getHumidityLine,
  // getCo2Line,
  // getVentLine,
  // getAlarmLine
} from '../api/envControl';
import { el } from 'element-plus/es/locale';

interface Alarm {
  alarmData: string,
  alarmType: string
  alarmTypeEn: string,
  branchCode: string
  farmCode: string,
  houseName: string,
  iotLocation: string,
  isCeased: boolean,
  timestamp: string,
};

/**
 * 格式化指标
 * @param val 指标值
 * @param toFixedNumber 需要保留的小数位数
 * @returns 格式化后的值
 */
const formatMetric = (val: null | number | string, toFixedNumber: number) => {
  if (val === null) return '-'
  if (toFixedNumber !== undefined) {
    return Number(val).toFixed(toFixedNumber);
  } else {
    return Number(val);
  }
};


export default defineStore('envControl', {
  state: () => {
    return {
      /********* 两侧的列表 *********/
      projectList: [] as Option[],
      livestockOnHand: {
        iotLocation: "",
        dayAge: 0,
        StartDate: "",
        display: "",
        startDate: "",
        incubator: 0,
        incubatorTemp: '-',
      },
      lowHighTemp: {
        branchCode: "",
        dayAge: 0,
        enterDayAge: 0,
        lowAlarmNum: 0,
        lowWarnNum: 0,
        targetNum: 0,
        highWarnNum: 0,
        highAlarmNum: 0,
        diffLowNum: 0,
        diffHighNum: 0,
      },
      currentProject: '',
      // temperatureList: [],
      // humidityList: [],
      // ventList: [],
      // CO2List: [],
      // alarmList: [] as Alarm[],
      temperatureLoading: false,
      humidityLoading: false,
      ventLoading: false,
      alarmLoading: false,
      CO2Loading: false,
      alarmLineLoading: false,
      /********* 中间的筛选条件 *********/
      activeName: 'breed',
      orgComboBox: [],
      /********* 中间的当前值 *********/
      temperatureChartLoading: false,
      humidityChartLoading: false,
      ventChartLoading: false,
      CO2ChartLoading: false,
      currentTemperature: {
        min: 0,
        max: 0,
        now: 0,
        target: '',
        targetMin: '',
        targetMax: '',
        outSideData: '' // 室外温度
      },
      currentHumidity: {
        min: 0,
        max: 0,
        now: 0,
        target: ''
      },
      currentCO2: {
        min: 0,
        max: 0,
        now: 0
      },
      currentAmmonia: {
        min: 0,
        max: 26,
        now: 0,
      },
      draughtFan: [
        { status: 0 },
        { status: 0 },
        { status: 0 },
        { status: 0 },
        { status: 0 },
        { status: 0 }
      ],
      // temperatureLine: [],
      // humidityLine: [],
      // co2Line: [],
      // ventLine: [],
      ventGuage: { now: 0, max: 100, min: 0 },
      // alarmLine: {
      //   envDataInfoList: [] as { label: string, value: number }[],
      //   warnTimeList: [] as string[],
      //   ceasedtimeList: [] as string[],
      //   preCeasedtime: '',
      //   preWarnTime: '',
      //   targetData: null,
      //   envType: 0,
      //   envTypeName: ''
      // },
      unitVentQty: 0,// 风机数量
      unitVentRunNum: 0,
      unitVentNotRunNum: 0,
      unitVent: [{
        farmCode: "",
        keyInfo: "",
        startTime: "",
        endTime: "",
        value: "true",
        status: 0,
        display: '',
      }],// 风机详情
      unitVentFc: [{
        farmCode: "",
        keyInfo: "",
        startTime: "",
        endTime: "",
        value: "true",
        status: 0,
        display: '',
      }],// 变频风机详情
      deviceNumTemp: [] as Number[],
      deviceNumHumidity: [] as Number[],
      deviceNumCo2: [] as Number[],
      deviceNumAmmonia: [] as Number[],
      deviceNumFan: [] as Number[],
      deviceNumWaterCurtain: [] as Number[],
      deviceNumFeedTower: [] as string[],
      deviceNumPower: [] as Number[],

      feedX: [] as string[],
      feedY: [] as Number[],
      waterX: [] as string[],
      waterY: [] as Number[],
      waterTempX: [] as string[],
      waterTempY: [] as Number[],
      electricityX: [] as string[],
      electricityY: [] as Number[],
      gasX: [] as string[],
      gasY: [] as Number[],
    };
  },
  actions: {
    /**
     * 获取筛选条件的下拉
     */
    getIotComboBox(cb: Function) {
      getIotComboBox().then((res: any) => {
        this.orgComboBox = res.list;
        cb(res.list);
      });
    },
    /**
     * 获取当前栋舍单元生猪或仔猪日龄
     */
    getLivestockOnHand(query: object) {
      getLivestockOnHand(query).then((res: any) => {
        this.livestockOnHand = res.list[0];
        let queryJson = JSON.parse(JSON.stringify(query));
        if (this.livestockOnHand && this.livestockOnHand.dayAge) {
          if (!queryJson.farm || !queryJson.pigpent) {
            this.livestockOnHand.display = ""
          } else {
            // 根据栋舍名称判断是肥猪还是仔猪
            if (queryJson.farm.indexOf('种猪') >= 0 && queryJson.pigpent.indexOf('分娩') >= 0) {
              this.livestockOnHand.display = "仔猪日龄：" + this.livestockOnHand.dayAge + "天";
              this.livestockOnHand.incubator = 1;
              if (this.livestockOnHand.dayAge < 7) {
                this.livestockOnHand.incubatorTemp = 35 + '°C';
              } else if (this.livestockOnHand.dayAge < 14) {
                this.livestockOnHand.incubatorTemp = 30 + '°C';
              } else {
                this.livestockOnHand.incubatorTemp = '保温灯关闭';
              }
            } else if (queryJson.farm.indexOf('种猪') >= 0 && queryJson.pigpent.indexOf('隔离') >= 0) {
              this.livestockOnHand.display = "猪只日龄：" + this.livestockOnHand.dayAge + "天";
              this.livestockOnHand.incubator = 0;
              // if (this.livestockOnHand.dayAge < 7) {
              //   this.livestockOnHand.incubatorTemp = 35 + '°C';
              // } else if (this.livestockOnHand.dayAge < 14) {
              //   this.livestockOnHand.incubatorTemp = 30 + '°C';
              // } else {
              //   this.livestockOnHand.incubatorTemp = '保温灯关闭';
              // }
            } else if (queryJson.farm.indexOf('育肥') >= 0) {
              this.livestockOnHand.display = "猪只日龄：" + (this.livestockOnHand.dayAge + 21) + "天";
            } else {
              this.livestockOnHand.display = ""
            }
          }
        } else {
          if (queryJson.farm.indexOf('育肥') >= 0) {
            this.livestockOnHand = {
              iotLocation: "",
              dayAge: 0,
              StartDate: "",
              display: "空舍•出猪",
              startDate: "",
              incubator: 0,
              incubatorTemp: '',
            };
          } else if (queryJson.farm.indexOf('种猪') >= 0 && queryJson.pigpent.indexOf('分娩') >= 0) {
            {
              this.livestockOnHand = {
                iotLocation: "",
                dayAge: 0,
                StartDate: "",
                display: "暂无存栏日期",
                startDate: "",
                incubator: 0,
                incubatorTemp: '',
              };
            }
          } else if (queryJson.farm.indexOf('种猪') >= 0 && queryJson.pigpent.indexOf('隔离') >= 0) {
            {
              this.livestockOnHand = {
                iotLocation: "",
                dayAge: 0,
                StartDate: "",
                display: "暂无存栏日期",
                startDate: "",
                incubator: 0,
                incubatorTemp: '',
              };
            }
          }
        }
      });
    },
    /**
     * 获取高低温预警信息
     */
    getLowHighTemp(query: object) {
      getLowHighTemp(query).then((res: any) => {
        // console.log(res)
        // console.log(!res)
        // console.log(res.lowAlarmNum)
        // console.log(res.lowAlarmNum === null)
        if (!res || res.lowAlarmNum === null) {
          this.lowHighTemp = {
            branchCode: "",
            dayAge: 0,
            enterDayAge: 0,
            lowAlarmNum: 0,
            lowWarnNum: 0,
            targetNum: 0,
            highWarnNum: 0,
            highAlarmNum: 0,
            diffLowNum: 0,
            diffHighNum: 0,
          };
          // console.log(this.lowHighTemp)
        } else {
          this.lowHighTemp = res;
        }
      });
    },
    /**
     * 切换项目
     */
    changeProject(projectId: string) {
      this.currentProject = projectId;
      // 切换视频
    },
    /**
    * 获取当前条件下的通风需求量(雷达图)
    */
    getVentGuage(query: object) {
      getVentGuage(query).then((res: any) => {
        if (res.list.length) {
          const data = res.list[0];
          this.ventGuage = {
            max: Number((+data.maxData).toFixed(1)),
            min: Number((+data.minData).toFixed(1)),
            now: Number((+data.nowData).toFixed(1)),
          }
        } else {
          this.ventGuage = {
            max: 100, // 默认100画刻度
            min: 0,
            now: 0
          };
        }
      }).catch(() => {
        this.ventChartLoading = false;
        this.ventGuage = {
          max: 100, // 默认100画刻度
          min: 0,
          now: 0
        };
      })
    },
    /**
     * 获取当前条件下的温度
     */
    getCurrentTemperature(query: object) {
      this.temperatureChartLoading = true;
      getCurrentTemperature(query).then((res: any) => {
        this.temperatureChartLoading = false;
        const data = res.list.length ? res.list[0] : null;
        if (data) {
          const traget = (+data.targetData).toFixed(1);
          this.currentTemperature = {
            min: +(+data.minData).toFixed(1),
            max: +(+data.maxData).toFixed(1),
            now: +(+data.nowData).toFixed(1),
            target: traget,
            targetMin: +traget - 2 + '',
            targetMax: +traget + 5 + '',
            outSideData: (+data.outSideData).toFixed(1)
          };
        } else {
          this.temperatureChartLoading = false;
          this.currentTemperature = {
            min: 0,
            max: 0,
            now: 0,
            target: '',
            targetMin: '',
            targetMax: '',
            outSideData: ''
          };
        }
      }).catch(() => {
        this.temperatureChartLoading = false;
      })
    },
    /**
     * 获取当前条件下的湿度
     */
    getCurrentHumidity(query: object) {
      this.humidityChartLoading = true;
      getCurrentHumidity(query).then((res: any) => {
        this.humidityChartLoading = false;
        const data = res.list.length ? res.list[0] : null;
        if (data) {
          this.currentHumidity = {
            min: +(+data.minData).toFixed(1),
            max: +(+data.maxData).toFixed(1),
            now: +(+data.nowData).toFixed(1),
            target: (+data.targetData).toFixed(1)
          };
        } else {
          this.humidityChartLoading = false;
          this.currentHumidity = {
            min: 0,
            max: 0,
            now: 0,
            target: ''
          };
        }
      }).catch(() => {
        this.humidityChartLoading = false;
      })
    },
    /**
     * 获取当前条件下的二氧化碳
     */
    getCurrentCO2(query: object) {
      this.CO2ChartLoading = true;
      getCurrentCO2(query).then((res: any) => {
        this.CO2ChartLoading = false;
        const data = res.list.length ? res.list[0] : null;
        if (data) {
          this.currentCO2 = {
            min: +(+data.minData).toFixed(1),
            max: +(+data.maxData).toFixed(1),
            now: +(+data.nowData).toFixed(1),
          };
          if (this.currentCO2.now < 500) {
            this.currentCO2.now = 500
          }
        } else {
          this.CO2ChartLoading = false;
          this.currentCO2 = { min: 0, max: 0, now: 0 };
        }
      }).catch(() => {
        this.CO2ChartLoading = false;
      })
    },
    /**
     * 获取当前条件下的通风需求量(折线图)
     */
    // getVentLine(query: object) {
    //   this.ventChartLoading = true;
    //   getVentLine(query).then((res: any) => {
    //     this.ventChartLoading = false;
    //     this.ventLine = (res.list || []).map((v: any) => {
    //       return {
    //         label: v.timestamp.slice(11, 16), // '2022-11-22 14:40:00' => '14:40'
    //         value: (+v.nowData).toFixed(2)
    //       }
    //     })
    //   }).catch(() => {
    //     this.ventChartLoading = false;
    //   })
    // },
    /**
     * 获取当前的顶部风机
     */
    getCurrentDraughtFan(query: object) {
      getCurrentDraughtFan(query).then((res: any) => {
        const data = res.list.length ? res.list[0] : null;
        if (data) {
          this.draughtFan = [];
          for (let i = 1; i <= 6; i++) {
            if (i <= data.ventNum) {
              this.draughtFan.push({ status: 1 });
            } else {
              this.draughtFan.push({ status: 0 });
            }
          }
        } else {
          this.draughtFan = [
            { status: 0 },
            { status: 0 },
            { status: 0 },
            { status: 0 },
            { status: 0 },
            { status: 0 }
          ]
        };
      });
    },
    getUnitVent(query: object) {
      getUnitVent(query).then((res: any) => {
        this.unitVentQty = res.total;
        this.unitVent = res.list;

        let queryJson = JSON.parse(JSON.stringify(query))
        if (queryJson.farm && (queryJson.farm.indexOf('种猪') >= 0 || queryJson.farm.indexOf('育肥') >= 0)) {
          this.unitVentFc = [{
            farmCode: "",
            keyInfo: "",
            startTime: "",
            endTime: "",
            value: "true",
            status: 3,
            display: '变频风机<br/>&nbsp;',
          }];// 风机详情
        } else {
          this.unitVentFc = []
        }

        for (let i = 0; i < this.unitVent.length; i++) {
          if (this.unitVent[i].value === 'true') {
            this.unitVent[i].status = 1;
            if (this.ventGuage.now >= 0 && this.ventGuage.now < 5) {
              this.unitVent[i].status = 3;
            } else if (this.ventGuage.now >= 5 && this.ventGuage.now < 50) {
              this.unitVent[i].status = 2;
            } else if (this.ventGuage.now >= 50 && this.ventGuage.now < 100) {
              this.unitVent[i].status = 1;
            }
            if (this.unitVentFc[0] && this.unitVent[i].status > 0) {
              // this.unitVentFc[0].status = Math.max(this.unitVentFc[0].status, this.unitVent[i].status)
              this.unitVentFc[0].status = Math.min(this.unitVentFc[0].status, this.unitVent[i].status)
            }
          } else {
            this.unitVent[i].status = 0;
          }
          let display = this.unitVent[i].startTime ? this.unitVent[i].startTime : this.unitVent[i].endTime;
          if (this.unitVent[i].status) {
            display = '开启' + display.substring(display.indexOf('-') + 1);
          } else {
            display = '关闭' + display.substring(display.indexOf('-') + 1);
          }
          this.unitVent[i].display = display.replace(" ", "<br/>");

        }

        this.unitVentRunNum = this.unitVent.filter((item: any) => item.status === 2 || item.status === 3).length;
        this.unitVentNotRunNum = this.unitVent.length - this.unitVentRunNum;
        this.unitVentRunNum += 1;
      });
    },
    getDeviceNumList(query: object) {
      getDeviceNumList(query).then((res: any) => {
        // console.log(res)
        // 第一个值是运行，第二个值是关闭，第三个值是故障
        this.deviceNumTemp = res.温度 || []
        this.deviceNumHumidity = res.湿度 || []
        this.deviceNumCo2 = res.二氧化碳 || []
        // this.deviceNumAmmonia = res.氨气 || []
        this.deviceNumAmmonia = [1, 0, 0]
        this.deviceNumWaterCurtain = res.水帘 || []
        this.deviceNumFan = res.风机 || []
        this.deviceNumFeedTower = res.料塔 || []
        this.deviceNumPower = res.备用电 || []

        if (this.deviceNumFeedTower && this.deviceNumFeedTower[0] && this.deviceNumFeedTower[0].length > 5) {
          let str = this.deviceNumFeedTower[0];
          let brIndex = str.indexOf("/", str.indexOf("/") + 1);

          this.deviceNumFeedTower[0] = str.substring(0, brIndex)
            + "<br/>" + str.substring(brIndex + 1, str.length)
        }
      });
    },
    getDailyList(query: object) {
      getDailyList(query).then((res: any) => {
        let feedX = [];
        let feedY = [];
        let waterX = [];
        let waterY = [];
        let waterTempX = [];
        let waterTempY = [];
        let electricityX = [];
        let electricityY = [];
        let gasX = [];
        let gasY = [];
        // DailyList: {
        //   locationName: "隔离舍",
        //   feed: 580.0,
        //   water: 4.0,
        //   waterTemp: 22.2,
        //   electricity: 66.0,
        //   gas: 0.0
        // },
        for (let i = 0; i < res.list.length; i++) {
          let data = res.list[i]
          // console.log(data.locationName)
          let locationName = data.locationName.replace("舍","");
          feedX.push(locationName)
          waterX.push(locationName)
          waterTempX.push(locationName)
          electricityX.push(locationName)
          gasX.push(locationName)

          feedY.push(data.feed)
          waterY.push(data.water)
          waterTempY.push(data.waterTemp)
          electricityY.push(data.electricity)
          gasY.push(data.gas)
        }
        this.feedX = feedX
        this.feedY = feedY

        this.waterX = waterX
        this.waterY = waterY

        this.waterTempX = waterTempX
        this.waterTempY = waterTempY

        this.electricityX = electricityX
        this.electricityY = electricityY

        this.gasX = gasX
        this.gasY = gasY
      });
    },
  },
});
