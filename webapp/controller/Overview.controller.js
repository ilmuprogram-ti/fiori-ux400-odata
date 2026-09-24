sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
  "use strict";
  return Controller.extend("ip.po.controller.Overview", {

    onInit: function () {
      // Keadaan layar sendiri, dipisahkan dari data OData. Mulai sibuk, karena
      // metadata layanan sudah diminta sebelum controller ini hidup.
      this._nJalan = 0;
      var oUi = new JSONModel({ busy: true, jumlah: 0 });
      this.getView().setModel(oUi, "ui");

      // requestSent/requestCompleted dipakai, bukan dataRequested pada binding,
      // supaya pemuatan metadata, penyaringan, dan muat ulang ikut tertangkap.
      //
      // Dihitung, bukan disetel benar/salah: permintaan bisa berjalan
      // bersamaan, dan satu yang selesai lebih dulu akan memadamkan indikator
      // selagi yang lain masih berjalan.
      var oOData = this.getOwnerComponent().getModel();
      var fnMulai = function () { this._nJalan += 1; this._perbarui(); }.bind(this);
      var fnSelesai = function () { this._nJalan = Math.max(0, this._nJalan - 1); this._perbarui(); }.bind(this);
      oOData.attachRequestSent(fnMulai);
      oOData.attachRequestCompleted(fnSelesai);
      oOData.attachRequestFailed(fnSelesai);
    },

    _perbarui: function () {
      this.getView().getModel("ui").setProperty("/busy", this._nJalan > 0);
    },

    onUpdateFinished: function () {
      // getLength() dibaca dari binding, bukan dari parameter "total" event ini:
      // pada muatan pertama parameter itu masih 0 ketika event dibangkitkan.
      var oBinding = this.byId("tabelPO").getBinding("items");
      this.getView().getModel("ui").setProperty("/jumlah", oBinding ? oBinding.getLength() : 0);
    },

    onSearch: function (oEvent) {
      var sQuery = (oEvent.getParameter("query") || oEvent.getParameter("newValue") || "").trim();
      var aFilter = [];
      if (sQuery) {
        // Nomor PO dan pemasok keduanya string di layanan ini, jadi Contains sah untuk dua-duanya.
        aFilter.push(new Filter({
          filters: [
            new Filter("PurchaseOrder", FilterOperator.Contains, sQuery),
            new Filter("Supplier", FilterOperator.Contains, sQuery)
          ],
          and: false
        }));
      }
      this.byId("tabelPO").getBinding("items").filter(aFilter);
    },

    onRefresh: function () {
      this.byId("tabelPO").getBinding("items").refresh(true);
    }
  });
});
