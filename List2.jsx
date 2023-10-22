import React, { useState, useEffect } from "react";
import "@progress/kendo-theme-default/dist/all.css";
import Heading from "../../../components/global/Heading";
import { GridList } from "../../CommonComponents/KendoComponents";
import { getItems } from "../../CommonComponents/KendoServices";

const Fields = [
  { selectedvalue: null, field: "Region", type: "dropdown", service: "Region", label: "Regions", row: 1, col: 1, span: 0, cascaded: { id: 0, field: "Period" } },
  { selectedvalue: null, field: "Period", type: "dropdown", service: "Period", label: "Periods", row: 1, col: 2, span: 0, isCasscaded: true, parentValue: null },
];

const initialDataState = {
  sort: [
    {
      field: "Name",
      dir: "asc",
    },
  ],
  take: 15,
  skip: 0
};

const columns = [
  { field: 'Id', title: 'Id'},
  { field: 'Name', title: 'Name', },
  //{ field: 'Description', title: 'Description', },
  { field: 'DepartmentName', title: 'Department' },
  { field: 'ComponentName', title: 'Component' },
  { field: 'GoalName', title: 'Quantity' },
  { field: 'Quantity', title: 'Quantity' },
  { field: 'NumberofEnv', title: 'NumberofEnv' },
  { field: 'StructureName', title: 'Structure' },
  { field: 'OperationName', title: 'Operation' },
  { field: 'StatusName', title: 'Status' },
  { field: 'StatementName', title: 'Statement' },
  { field: 'Occupancy', title: 'Occupancy' },
  { field: 'LocationName', title: 'Location' },
  { field: 'Startdate', title: 'StartTime' },
  { field: 'PlannedStopTime', title: 'PlannedStopTime' },
  { field: 'RecordingTime', title: 'Recording Date' },
];

const List2 = () => {

  const [data, setData] = useState([]);
  const [gridData, setGridData] = useState();

  const getData = async (input) => {
    if (input.Period > 0) {
      const body = {
        testBenchId: 0,
        periodId: input.Period
      }
      console.log("Get Data Called ", body);
      var json = await getItems("TestBench", "ListTestBench", body);
      setData(json);
    }
  }


  useEffect(() => {
    //getData();
    setGridData({
      data: data,
      initialDataState: initialDataState,
      columns: columns,
      fields: Fields,
      filterable: true,
      NavigationState: "/Test-bench/List/Details"
    })
  }, []);

  useEffect(() => {
    if (data != null) {
      setGridData({
        data: data,
        initialDataState: initialDataState,
        columns: columns,
        fields: Fields,
        filterable: true,
        NavigationState: "/Test-bench/List/Details"
      })
    }
  }, [data]);



  return (
    <div className="view-main">
      <div className="basic-view">
        <Heading para={"Test Bench - List"} />
        {gridData ? (<GridList gridData={gridData} getData={getData} />) : (<div>Loading...</div>)}
      </div>
    </div>
  );
};

export default List2;
