  <label for="multiselect">Select Columns to display</label>
    <input id="multiselect" style="width:50%" />
    <div id="grid"></div>
    <script>
      var columns = [{
        field:"OrderID",
        filterable: false,
        width: 70
      },{
        field: "Freight",
        width: 70
      },{
        field: "ShipName",
        title: "Ship Name",
        width: 150
      }, {
        field: "ShipCity",
        title: "Ship City",
        width:300
      }];

      $("#multiselect").kendoMultiSelect({
        dataTextField:"field",
        dataValueField:"field",
        dataSource: {
          data: columns
        },
        value:["OrderID", "Freight", "ShipName", "ShipCity"],
        change: function(e){
          var cols = this.value();
          var grid = $("#grid").data("kendoGrid");
          grid.setOptions({columns:cols});          
        }
      });

      $("#grid").kendoGrid({
        dataSource: {
          type: "odata",
          transport: {
            read: "https://demos.telerik.com/kendo-ui/service/Northwind.svc/Orders"
          },
          schema: {
            model: {
              fields: {
                OrderID: { type: "number" },
                Freight: { type: "number" },
                ShipName: { type: "string" },
                ShipCity: { type: "string" }
              }
            }
          },
          pageSize: 20,
          serverPaging: true,
          serverFiltering: true,
          serverSorting: true
        },
        height: 550,
        filterable: true,
        sortable: true,
        pageable: true,
        columns: columns
      });
    </script>
