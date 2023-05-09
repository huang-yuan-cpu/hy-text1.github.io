import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';
import { getDuration } from '@/utils/index';
import type { Warn } from '@/views/warn/warn';
import img_poster_camera from '@/assets/camera.png';
import {
  getPowrFailureCameraList,
  getPowrFailureList,
  powerfailureProcess,
} from "@/api";

export default defineStore('warn', {
  state: () => {
    return {
      formParams: {}, // 顶部表单的查询条件
      cameraTree: [], // 左侧摄像头树状列表
      currentSelectedCameraId: '',
      monitorDeviceCount: 0, // 监控设备数
      powerFailureCount: 0, // 断电预警数
      warnDetailList: [], // 断电预警明细列表(分页)
      currentRowIndex: -1, // 当前处理、查看的行号
      total: 0, // 断电预警明细列表的总条数
      pageNum: 1, // 当前页
      pageSize: 10, // 每页多少条
      loading: false, // 加载效果
    }
  },
  actions: {
    /**
     * 获取左侧的摄像头树状列表
     */
    getCameraTree() {
      getPowrFailureCameraList(this.formParams).then((res: any) => {
        this.currentSelectedCameraId = '';
        this.monitorDeviceCount = res.cameraCount;
        this.powerFailureCount = res.powerFailureCount;
        this.cameraTree = res.list.map((farm: any) => {
          farm.id = farm.farmId;
          farm.cameraList.forEach((item: any) => {
            item.isLeaf = true;
            // 取不到缩略图，暂时用一张静态图片占位
            item.poster = img_poster_camera;
          });
          return farm;
        });
      });
    },
    /**
     * 获取树的选中项的id
     */
    setTreeSelectId(id: string) {
      this.currentSelectedCameraId = id;
    },
    /**
     * 获取右侧的断电预警明细列表(带分页)
     */
    getDetailList() {
      this.loading = true;
      getPowrFailureList({
        ...this.formParams,
        cameraId: this.currentSelectedCameraId
      }, this.pageNum, this.pageSize).then((res: any) => {
        this.loading = false;
        this.currentRowIndex = -1; // 每次查询，选中项重置
        this.total = res.total;
        this.warnDetailList = res.list.map((item: Warn) => {
          // 遮挡暂时没有异常时长
          if (item.type === 1) return item;

          let duration = '';
          const { createTime, recoveryTime } = item;
          if (!createTime) {
            duration = '';
          } else {
            duration = getDuration(createTime, recoveryTime);
          }
          return { ...item, duration };
        });
      }).catch(() => {
        this.loading = false;
        this.warnDetailList = [];
      });
    },
    /**
     * 处理断电预警
     */
    powerfailureProcess(params: object, cb: Function) {
      powerfailureProcess(params).then((res: any) => {
        ElMessage({
          showClose: true,
          message: "处理成功",
          type: "success",
        });
        cb();
      }).catch(() => {
        ElMessage({
          showClose: true,
          message: "处理失败",
          type: "error",
        });
      })
    },
    /**
     * 重置树的选中，列表的分页
     */
    reset() {
      this.resetTree();
      this.resetPage();
    },
    /**
     * 重置树的选中
     */
    resetTree() {
      this.currentSelectedCameraId = '';
    },
    /**
     * 重置分页
     */
    resetPage() {
      this.pageNum = 1;
      this.pageSize = 10;
    }
  }
})
