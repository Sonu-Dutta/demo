import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Download, UndoRounded } from "@mui/icons-material";
import { useAsyncError, useNavigate } from "react-router-dom";
import {
  Grid,
  GridColumn as Column,
  GridToolbar,
  GridNoRecords,
} from "@progress/kendo-react-grid";
import { process } from "@progress/kendo-data-query";
import { MyCommandCell, CRUD, getItems, formatDate } from "./KendoServices";
import {
  ExcelExport,
  ExcelExportColumn,
} from "@progress/kendo-react-excel-export";
import { DropDownList, AutoComplete } from "@progress/kendo-react-dropdowns";
import { Button } from "@progress/kendo-react-buttons";
import { Stepper } from "@progress/kendo-react-layout";
import { GridLayout, GridLayoutItem } from "@progress/kendo-react-layout";
import {
  Form,
  Field,
  FormElement,
  FieldWrapper,
} from "@progress/kendo-react-form";
import { Input, NumericTextBox } from "@progress/kendo-react-inputs";
import { Error } from "@progress/kendo-react-labels";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Dialog } from "@progress/kendo-react-dialogs";

export const GridList = ({ gridData = [], getData }) => {
  const {
    data,
    initialDataState,
    columns,
    NavigationState,
    fields,
    filterable,
  } = gridData;
  const navigate = useNavigate();
  const [dataState, setDataState] = useState(initialDataState);
  const excelExportRef = useRef(null);

  //console.log("GridList ", gridData);

  const [pageSizeValue, setPageSizeValue] = useState();
  const [InputFormCallback, setInputFormCallback] = useState({
    data: [],
    action: "filter",
  });
  const [InputFormData, setInputFormData] = useState({
    _gap: { rows: 0, cols: 20 },
    _formData: {
      fields: fields,
    },
    _formAction: "filter",
  });

  const pageChange = (event) => {
    const targetEvent = event.targetEvent;
    const take = targetEvent.value === "All" ? 75 : event.page.take;
    if (targetEvent.value) {
      setPageSizeValue(targetEvent.value);
    }
    setDataState({
      ...event.page,
      take,
    });
  };

  useEffect(() => {}, []);

  const handleRowClick = async(event) => {    
    const clickedRowData = event.dataItem;
    //debugger;
    try {
      const response = await getItems(
        "TestBench",
        "GetTestBench",
        { TestBenchId: clickedRowData.Id}  //
      );    
    const testBenchlistJson = response
    navigate(NavigationState, { state: { rowData: clickedRowData , testBenchlistJson: testBenchlistJson} });
  } 
  catch (error) {
    console.error("Error fetching data:", error);
  }
  };

  const handlePageChange = (event) => {
    setDataState({
      ...dataState,
      skip: event.page.skip,
      take: event.page.take,
    });
  };

  const exportToExcel = () => {
    if (excelExportRef.current) {
      excelExportRef.current.save();
    }
  };

  const handleInputEvents = {
    handleSubmit: (Input) => {},
    handleEdit: (Input) => {},
    handleClear: (Input) => {},
  };

 const FilterDropdown = (field) => {
    const [dropdownData, setDropdownData] = useState([]);
    const [dropdownValue, setDropdownValue] = useState(null);
    const [Field, setField] = useState(null);

    useEffect(() => {
      if (field != null) {
        setField(field);
      }
    }, [field]);
    const fetchDropdownData = async () => {
      console.log("Fetch DropDown Data");
      try {
        const response = await getItems(
          "MasterData",
          "list" + Field.field.service
        );
        const data = response;
        setDropdownData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchCasscadingDropDownData = async (body) => {
      console.log("Fetch Cascaded DropDown Data");
      console.log(body);
      try {
        const response = await getItems(
          "MasterData",
          "list" + Field.field.service,
          { Id: body.Id }
        );
        const data = response;
        setDropdownData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    const handleDropdownOpen = (e) => {
      console.log("handle Dropdown Open");
      console.log(Field.field.isCasscaded);
      if (!Field.field.isCasscaded) fetchDropdownData();
      else fetchCasscadingDropDownData(Field.field.parentValue);
    };
    const handleDropdownChange = (event) => {
      console.log("handle Dropdown Change");
      setDropdownValue(event.target.value);
      Field.field.selectedvalue = event.target.value;

      if (!Field.field.isCasscaded && Field.field.isCasscaded !== undefined) {
        console.log("fields", fields);
        Field.field.cascaded.id = event.target.value.Id;
      }
      const index = Field.field.cascaded
        ? fields.findIndex((item) => item.field === Field.field.cascaded.field)
        : -1;
      const valIndex = fields.findIndex(
        (item) => item.field === Field.field.field
      );
      if (index > 0) fields[index].parentValue = Field.field.selectedvalue;
      console.log("Handle Dropdown Second Stage");
      console.log(fields[valIndex]);
      fields[valIndex].selectedvalue = Field.field.selectedvalue;
      //onChangeCallback(props);
    };

    if (Field != null) console.log(Field.field);

    if (Field != null)
      return (
        <div className="inp-div">
          <DropDownList
            data={dropdownData != [] ? dropdownData : []}
            textField="Name"
            dataItemKey="Id"
            defaultItem={{ Name: "Select " + Field.field.label }}
            value={dropdownValue}
            onOpen={handleDropdownOpen}
            onChange={handleDropdownChange}
          />
        </div>
      );
  };

  const FilterList = () => {     
    const body = {};
    fields.forEach((item) => {
      body[item.field] = item.selectedvalue.Id;
    });
    console.log("body", body);
    getData(body);
  };

  const dynamicColumnWidth = (dataItem, column) => {
    if (column.field === "name") {
      return 2 * column.field.length + "em";
    }
    return "auto"; // Default width
  };

  return (
    <div>
      {gridData != null ? (
        <div>
          <div>
            <Grid
              pageable={{
                buttonCount: 5,
                info: true,
                pageSizeValue: pageSizeValue,
                type: "numeric",
                pageSizes: [50, 100, "All"],
              }}
              sortable={true}
              filterable={true}
              resizable={true}
              onPageChange={handlePageChange}
              style={{ height: "89.7%", width: "96.6%" }}
              data={process(data, dataState)}
              {...dataState}
              skip={dataState.skip}
              take={dataState.take}
              onDataStateChange={(e) => {
                setDataState(e.dataState);
              }}
              onRowClick={handleRowClick}
              className="list-div"
            >
              <GridToolbar>
                <div className="exports-btn-grp">
                  <Button className="export-button btn" onClick={exportToExcel}>
                    <Download className="downloadIcon" /> Excel
                  </Button>
                </div>
                {gridData.filterable ? (
                  <div>
                    {fields.map((field, props) => (
                      <FilterDropdown field={field} />
                    ))}
                    <Button className="export-button btn4" onClick={FilterList}>
                      Filter
                    </Button>
                  </div>
                ) : undefined}
              </GridToolbar>
              <GridNoRecords>There is no data available</GridNoRecords>
              {columns != null ? (
                columns.map((column, index) => (
                  <Column
                    key={index}
                    field={column.field}
                    title={column.title}
                    width={column.width}
                    className={column.className}
                  />
                ))
              ) : (
                <div />
              )}
            </Grid>
            <ExcelExport
              data={data}
              ref={excelExportRef}
              filterable={true}
              fileName="ListData.xlsx"
            >
              <ExcelExportColumn
                field="id"
                title="ID"
                editable={false}
                width={50}
              />
              {columns != null ? (
                columns.map((column, index) => (
                  <ExcelExportColumn
                    field={column.field}
                    title={column.title}
                  />
                ))
              ) : (
                <div />
              )}
            </ExcelExport>
          </div>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
};

const updateValuesInJSONObject = (obj, dataItem) => { 
  console.log(updateValuesInJSONObject)
  const updatedObj = { ...obj };

  for (const key in dataItem) {
    if (updatedObj.hasOwnProperty(key)) {
      updatedObj[key] = dataItem[key];
    }
  }

  return updatedObj;
};

const DropDownCell = React.memo((props) => {
  const [dropdownData, setDropdownData] = useState([]);
  const [SubTypeInput, setSubTypeInput] = useState({});
  const field = props.field || "";

  const handleChange = (e) => {
    console.log("props.onChange");
    if (e.target.value != null) {
      console.log("Selected item:", e.target.value);
      console.log(SubTypeInput);
      if (e.target.value != SubTypeInput) {
        //fetchDropdownData();
        reloadGridData(e.target.value);
      } else {
        setSubTypeInput(e.target.value); //fetchDropdownData();
        console.log(e.target.value);
      }
    }
    if (props.onChange) {
      props.onChange({
        dataIndex: 0,
        dataItem: props.dataItem,
        field: props.field,
        syntheticEvent: e.syntheticEvent,
        value: e.target.value.Id,
      });
    }
  };

  const handleDropdownOpen = () => {
    if (dropdownData.length <= 0) {
      //fetchDropdownData();
    }
  };

  const defaultItem = {
    Name: "Select " + props.field,
  };

  const { dataItem, reloadGridData, data } = props;

  useEffect(() => {
    if (data[field] != undefined) setDropdownData(data[field]);
  }, []);

  if (dropdownData.length >= 0) {
    const dataValue = dataItem[field] === null ? "" : dataItem[field];

    return (
      <td>
        {dataItem.inEdit ? (
          <DropDownList
            style={{ width: props.width }}
            onChange={handleChange}
            textField="Name"
            dataItemKey="Id"
            defaultItem={dataValue !== null ? dataValue : defaultItem}
            onOpen={handleDropdownOpen}
            value={dropdownData.find((c) => c.Id === dataValue)}
            data={dropdownData !== null ? dropdownData : []}
          />
        ) : (
          dataValue
        )}
      </td>
    );
  }
});

export const GridCRUD = memo(({ gridData = [], setOutData }) => {
  const gridRef = useRef(null);

  const FilterList = () => {  
    
    var body = {};
    fields.forEach((item) => {
      body["Id"] = item.selectedvalue.Id;
    });
    console.log("body", body);
    console.log(fields)
    refreshGrid(controller, page, body);
    //reset dropdwn value
    console.log(fields)
  };

  const [InputFormCallback, setInputFormCallback] = useState({
    data: [],
    action: "Add",
  });

  const editField = "inEdit";
  const excelExportRef = useRef(null);
  const { initialDataState, columns, controller, page, fields, filterable } = gridData;
  const [data, setData] = useState([]);
  const [dataState, setDataState] = useState(initialDataState);
  const [commandLable, setCommandLable] = useState("Add");
  const [Init, setInit] = useState(false);
  const [InputFormData, setInputFormData] = useState({
    _gap: { rows: 0, cols: 20 },
    _formData: {
      fields: fields,
    },
    _formAction: commandLable,
  });

  const FilterDropdown = (field) => {
    const [dropdownData, setDropdownData] = useState([]);
    const [dropdownValue, setDropdownValue] = useState(null);
    const [Field, setField] = useState(null);

    useEffect(() => {
      if (field != null) {
        setField(field);
      }
    }, [field]);
    const fetchDropdownData = async () => {
      console.log("Fetch DropDown Data");
      try {
        const response = await getItems(
          "MasterData",
          "list" + Field.field.service
        );
        const data = response;
        setDropdownData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchCasscadingDropDownData = async (body) => {
      console.log("Fetch Cascaded DropDown Data");
      console.log(body);
      try {
        const response = await getItems(
          "MasterData",
          "list" + Field.field.service,
          { Id: body.Id }
        );
        const data = response;
        setDropdownData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    const handleDropdownOpen = (e) => {
      console.log("handle Dropdown Open");
      console.log(Field.field.isCasscaded);
      if (!Field.field.isCasscaded) fetchDropdownData();
      else fetchCasscadingDropDownData(Field.field.parentValue);
    };
    const handleDropdownChange = (event) => {
      console.log("handle Dropdown Change");
      setDropdownValue(event.target.value);
      Field.field.selectedvalue = event.target.value;

      if (!Field.field.isCasscaded && Field.field.isCasscaded !== undefined) {
        console.log("fields", fields);
        Field.field.cascaded.id = event.target.value.Id;
      }
      const index = Field.field.cascaded
        ? fields.findIndex((item) => item.field === Field.field.cascaded.field)
        : -1;
      const valIndex = fields.findIndex(
        (item) => item.field === Field.field.field
      );
      if (index > 0) fields[index].parentValue = Field.field.selectedvalue;
      console.log("Handle Dropdown Second Stage");
      console.log(fields[valIndex]);
      fields[valIndex].selectedvalue = Field.field.selectedvalue;
      //onChangeCallback(props);
    };

    if (Field != null) console.log(Field.field);

    if (Field != null)
      return (
       
        <div className="inp-div">
          <DropDownList
            data={dropdownData != [] ? dropdownData : []}
            textField="Name"
            dataItemKey="Id"
            defaultItem={{ Name: "Select " + Field.field.label }}
            value={dropdownValue}
            onOpen={handleDropdownOpen}
            onChange={handleDropdownChange}
          />
        </div>
       
      );
  };

  const refreshGrid = async (controller, page, body) => {      
    if(!gridData.filterable)
    {
      var json = await getItems(controller, "list" + page);
      setData(json);
      setInit(true);
    }
    else
    {    
      var json = []
      if(Init)
      {        
        json = await getItems(controller, "list" + page, body);
      }
      setData(json);
      setInit(true);  
    }
  };

  useEffect(() => {
    if (data != null) {
      setOutData(data);
    }
  }, [data]);

  useEffect(() => {
    if (gridData.Empty) {
      setInputFormData({
        _gap: { rows: 0, cols: 20 },
        _formData: {
          fields: fields,
        },
        formAction: commandLable,
      });
      setInit(true);
    } else {     
      refreshGrid(controller, page);
    }
  }, []);

  const remove = (dataItem) => {
    const newData = [...data];
    console.log("remove");
    if (gridData.Empty) {
      let index = data.findIndex((record) => record.Id === dataItem.Id);
      newData.splice(index, 1);
      setData(newData);
      setOutData(newData);
    } else {
      CRUD.Delete(dataItem, controller, page).then((res) => {
        if (res != -1) {
          let index = data.findIndex((record) => record.Id === dataItem.Id);
          newData.splice(index, 1);
          refreshGrid(controller, page);
        } else {
          console.log("Error In Delete " + page);
        }
        setData(newData);
      });
    }
  };

  const add = (dataItem) => {      
    console.log("ADD ");
    const newData = [...data];
    dataItem.inEdit = false;
    if (gridData.Empty) {
      const newDataItem = {
        Name: dataItem.Name,
        HardwareCategory: dataItem.HardwareCategory,
        HardwareCategorySubType: dataItem.HardwareCategorySubType,
        Count: dataItem.Count,
        Judgement: dataItem.Judgement,
        Remark: dataItem.Remark,
        Period: dataItem.Period,
        inEdit: dataItem.inEdit,
      };
      console.log(dataItem);
      setData([newDataItem]);
      //setOutData([newDataItem]);
    } else {     
      CRUD.Add(dataItem, controller, page).then((res) => {
             if (res != -1) {
          let newItem = updateValuesInJSONObject(newData[2], dataItem);
          let newItems = newData.filter((item) => item !== dataItem);
          setData([newItem, ...newItems]);
          refreshGrid(controller, page);
        } else {
          console.log("Error In Add " + page);
        }
      });
    }
  };

  const update = (dataItem) => {   
    console.log("Update")
    console.log(dataItem);
    console.log(data);
    const newData = [...data];
    dataItem.inEdit = false;
    CRUD.Edit(dataItem, controller, page).then((res) => {
      if (res != -1) {
        let index = newData.findIndex((record) => record.Id === dataItem.Id);
        newData[index] = dataItem;
        setData(newData);
        refreshGrid(controller, page);
      } else {
        console.log("Error In Update " + page);
      }
    });
  };

  const discard = () => {
    const newData = [...data];
    newData.splice(0, 1);
    setData(newData);
  };

  const cancel = (dataItem) => {
    const oldData = [...data];
    const originalItem = oldData.find((p) => p.Id === dataItem.Id);
    const newData = data.map((item) =>
      item.Id === originalItem.Id ? originalItem : item
    );
    setData(newData);
    refreshGrid(controller, page);
  };

  const enterEdit = (dataItem) => {    
    console.log("enterEdit");   
    if (gridData.Empty) {
      const newData = [...data];
      const updatedArray = fields.map((item) => {
        if (dataItem.hasOwnProperty(item.field)) {
          item.value = dataItem[item.field];
        }
        return item;
      });

      console.log(newData);
      console.log(InputFormCallback);
      setInputFormCallback({ data: updatedArray, action: "Save" });
    } else {   
     
      setData(
       
        data.map((item) =>
          item.Id === dataItem.Id
            ? {
                ...item,
                inEdit: true,
                ParentId: dataItem.ParentId
              }
            : item
        )
        
      );

      console.log(data)
      console.log(dataItem)
      
    }
  };

  const itemChange = (event) => {    
    console.log("ItemChangeGrid");
    console.log(event.dataItem);
    console.log(data);
    const newData = data.map((item) =>
      item.Id === event.dataItem.Id
        ? {
            ...item,
            [event.field || ""]: event.value,
          }
        : item
    );
    console.log(newData);
    setData(newData);
  };

  const addNew = (event) => { 
    console.log("ADD New");       
    const newDataItem = {
      Name: null,
      HardwareCategory: null,
      HardwareCategorySubType: null,
      Count: 0,
      Judgement: null,
      Remark: null,
      Period: null,
      inEdit: true,
      ParentId: fields != null ? fields[0].selectedvalue.Id : 0 // fields[0].selectedvalue get actual parentId
    };
    setData([newDataItem, ...data]);
    console.log([newDataItem, ...data]);
    console.log(fields);
    
  };

  const CommandCell = (props) => (
    <MyCommandCell
      {...props}
      edit={enterEdit}
      remove={remove}
      add={add}
      discard={discard}
      update={update}
      cancel={cancel}
      editField={editField}
    />
  );

  const exportToExcel = () => {
    if (excelExportRef.current) {
      excelExportRef.current.save();
    }
  };

  const handlePageChange = (event) => {
    setDataState({
      ...dataState,
      skip: event.page.skip,
      take: event.page.take,
    });
  };
  const handleSortChange = (event) => {
    setDataState({ ...dataState, sort: event.sort });
  };

  const handleFilterChange = (event) => {
    setDataState({ ...dataState, filter: event.filter, skip: 0 });
  };

  const handleInputEvents = {
    handleSubmit: (Input) => {
      debugger;
      if (InputFormCallback.action != "save") {
        setInputFormCallback({ data: Input, action: "Add New" });
        const newDataItem = Input.reduce((acc, item) => {
          if (item.type == "dropdown")
            acc[item.field] =
              item.selectedvalue !== null ? item.selectedvalue.Name : "";
          else acc[item.field] = item.selectedvalue;
          console.log(acc);
          return acc;
        }, {});
        console.log([newDataItem, ...data]);
        console.log(newDataItem);
        setInputFormCallback({ data: [], action: "Add" });
        setData([newDataItem, ...data]);
        setOutData([newDataItem, ...data]);
      }
    },
    handleEdit: (Input) => {      
      console.log("Handle Edit Callback from Grid");
      const newDataItem = fields.reduce((acc, item) => {
        if (item.type == "dropdown")
          acc[item.field] =
            item.selectedvalue != null ? item.selectedvalue.Name : null;
        else acc[item.field] = item.selectedvalue;
        return acc;
      }, {});

      Input.map((item) => {
        if (newDataItem.hasOwnProperty(item.field)) {
          if (item.selectedvalue != null) {
            if (item.type == "dropdown")
              newDataItem[item.field] =
                item.selectedvalue != null ? item.selectedvalue.Name : null;
            else newDataItem[item.field] = item.selectedvalue;
          }
        }
        return newDataItem;
      });
      setInputFormCallback({ data: [], action: "Add" });
      setData([newDataItem]);
      setOutData([newDataItem]);
    },
    handleClear: (Input) => {},
  };

  if (Init)
    return (
      <div>
        
        {/* {gridData.filterable ? (
                  <div>
                    {fields.map((field, props) => (
                      <FilterDropdown field={field} />
                    ))}
                    <Button className="export-button btn4" onClick={FilterList}>
                      Filter
                    </Button>
                  </div>
                ) : undefined} */}

        {gridData.Empty ? (
          <div className="gridcrud-input">
            <InputForm
              InputFormData={InputFormData}
              handleInputEvents={handleInputEvents}
              InputFormCallback={InputFormCallback}
              setInputFormCallback={setInputFormCallback}
            />
          </div>
        ) : undefined}

        <Grid
          style={{
            height: "100%",
            width: "100%",
          }}
          ref={gridRef}
          onItemChange={itemChange}
          editField={editField}
          sortablesort={dataState.sort}
          onSortChange={handleSortChange}
          filter={dataState.filter}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          filterable={true}
          resizable={true}
          pageable={{
            buttonCount: 5,
            info: true,
            type: "numeric",
            pageSizes: [10, 20, 50, 100, "All"],
          }}
          
          data={process(data, dataState)}
          {...dataState}
          skip={dataState.skip}
          take={dataState.take}
          onDataStateChange={(e) => {
            setDataState(e.dataState);
          }}
        >
          <GridToolbar>

          {gridData.filterable ? (
                  <div>
                    {fields.map((field, props) => (
                      <FilterDropdown field={field} />
                    ))}
                    <Button className="export-button btn4" onClick={FilterList}>
                      Filter
                    </Button>
                  </div>
                ) : undefined}

            {!gridData.Empty ? (
              <div>
                <button
                  title="Add"
                  className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
                  onClick={addNew}
                >
                  Add
                </button>
              </div>
            ) : undefined}

            <div className="exports-btn-grp">
              <Button
                className="export-button btn-GridExcel btn"
                onClick={exportToExcel}
              >
                <Download className="downloadIcon" /> Excel
              </Button>
            </div>
          </GridToolbar>
          {columns != null ? (
            columns.map((column, index) => {
              column.Id = index;
              return (
                <Column
                  editable={gridData.Empty ? false : true}
                  key={index}
                  field={column.field}
                  title={column.title}
                  width={column.width}
                  className={column.className}
                />
              );
            })
          ) : (
            <div />
          )}
          <Column cell={CommandCell} width="200px" filterable={false} />
        </Grid>
        <ExcelExport
          data={data}
          ref={excelExportRef}
          filterable={true}
          fileName="ListData.xlsx"
        >
          <ExcelExportColumn
            field="Id"
            title="ID"
            editable={false}
            width={50}
          />
          {columns != null ? (
            columns.map((column, index) => (
              <ExcelExportColumn field={column.field} title={column.title} />
            ))
          ) : (
            <div />
          )}
        </ExcelExport>
      </div>
    );
});

export const MultiStepForm = ({ MultiFormData, handleInputEvents }) => {
  useEffect(() => {
    setComponentArray(_componentsArray);
    setSteps(_steps);
  }, []);

  const [ResponseBody, setResponse] = useState();

  const { _componentsArray, _steps } = MultiFormData;

  const [formState, setFormState] = useState({});

  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  const [componentsArray, setComponentArray] = useState(_componentsArray);

  const [steps, setSteps] = useState(_steps);

  const lastStepIndex = _steps.length - 1;

  const isLastStep = lastStepIndex === currentComponentIndex;

  const isPreviousStepsValid =
    _steps
      .slice(0, currentComponentIndex)
      .findIndex((currentStep) => currentStep.isValid === false) === -1;

  const ComponentToRender = componentsArray[currentComponentIndex];

  const onStepSubmit = (event) => {
    //debugger;
    console.log("OnSubmitStep");
    console.log("Submit ", isLastStep);
    if (isLastStep) {
      console.log("ResponseBody in onStepSubmit ", ResponseBody);
      handleInputEvents.handleSubmit(ResponseBody);
    }
    const { isValid, values } = event;
    const currentSteps = steps.map((currentStep, index) => ({
      ...currentStep,
      isValid: index === currentComponentIndex ? isValid : currentStep.isValid,
    }));
    setSteps(currentSteps);
    setCurrentComponentIndex(() =>
      Math.min(currentComponentIndex + 1, lastStepIndex)
    );
    console.log(values);
    setFormState(values);
    if (isLastStep && isPreviousStepsValid && isValid) {
      console.log("IsLastStep", JSON.stringify(values));
    }
  };

  const onPrevClick = useCallback(
    (event) => {
      event.preventDefault();
      setCurrentComponentIndex(() => Math.max(currentComponentIndex - 1, 0));
    },
    [currentComponentIndex, setCurrentComponentIndex]
  );

  if (steps != null)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Stepper value={currentComponentIndex} items={steps} />
        <div>
          <div>
            <ComponentToRender setResponseData={setResponse} />
            <span
              style={{ marginTop: "40px" }}
              className={"k-form-separator"}
            />
            <div
              style={{
                justifyContent: "space-between",
                alignContent: "center",
              }}
              className={
                "k-form-buttons k-button k-button-md k-rounded-md k-button-solid k-button-solid-bases-end"
              }
            >
              <span style={{ alignSelf: "center" }}>
                Step {currentComponentIndex + 1} of 3
              </span>
              <div>
                {currentComponentIndex !== 0 ? (
                  <Button
                    style={{ marginRight: "16px" }}
                    className="btn-2"
                    onClick={onPrevClick}
                  >
                    Previous
                  </Button>
                ) : undefined}
                <Button
                  themeColor={"primary"}
                  className="btn"
                  disabled={isLastStep ? !isPreviousStepsValid : false}
                  onClick={onStepSubmit}
                >
                  {isLastStep ? "Submit" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export const InputForm = ({
  InputFormData = [],
  InputFormCallback,
  handleInputEvents,
  setInputFormCallback,
}) => {
  const { _rows, _cols, _gap, _formData, _formAction } = InputFormData;
  const [clearForm, setClearForm] = useState(false);
  const [formData, setFormData] = useState({});

  const handleInputFormEvents = {
    handleSubmit: (e) => {  
      //debugger;   
      console.log("Handler Submit From Input Form 0", e);
      if (InputFormCallback.action === "Save") {
        console.log("Save - ", _formData.fields);
        handleInputEvents.handleEdit(_formData.fields);
        console.log("Handler Submit Edit", _formData.fields);
      } else {
        //console.log(_formData.fields);
        handleInputEvents.handleSubmit(_formData.fields);
        const modifiedArray = _formData.fields.map((item) => ({
          ...item,
          selectedvalue: null,
        }));
        _formData.fields = modifiedArray;
        //console.log("Handler Submit From Input Form 1");
        //console.log(modifiedArray);
      }

      console.log(_formData.fields);
    },
    onClear: (formRenderProps) => {
      console.log(formRenderProps);
      handleInputEvents.handleClear(_formData.fields);
      const modifiedArray = _formData.fields.map((item) => ({
        ...item,
        selectedvalue: null,
      }));
      _formData.fields = modifiedArray;
      console.log("Handler Clear From Input Form");
      console.log(modifiedArray);
      _formData.fields = modifiedArray;
      setInputFormCallback({ data: modifiedArray, action: "Add" });
    },
  };

  const GetComponent = (props) => {
    const handleDropDownChange = (value) => {
      const index = value.cascadingData.field.cascaded
        ? _formData.fields.findIndex(
            (item) => item.field === value.cascadingData.field.cascaded.field
          )
        : -1;
      const valIndex = _formData.fields.findIndex(
        (item) => item.field === value.name
      );
      if (index > 0)
        _formData.fields[index].parentValue =
          value.cascadingData.field.selectedvalue;
      _formData.fields[valIndex].selectedvalue =
        value.cascadingData.field.selectedvalue;
    };

    const handleInputComponentChange = {
      input: (event, data) => {
        //console.log("handleInputChange From GetComponent");
        const valIndex = _formData.fields.findIndex(
          (item) => item.field === data.name
        );
        _formData.fields[valIndex].selectedvalue =
          event.target.value !== null
            ? event.target.value
            : "Not Entered Value";
        //console.log(_formData.fields);
      },
      datePicker: (date, data) => {
        //console.log("handleDateChange From GetComponent");
        const selectedDate = date.target.value;
        console.log("Selected Date:", selectedDate);
        const originalDate = new Date(Date.parse(selectedDate));
        const datetmp = formatDate(originalDate);
        console.log("Formated Date ", datetmp);
        //const formattedDate = datetmp.toISOString().split('T')[0];
        const valIndex = _formData.fields.findIndex(
          (item) => item.field === data.name
        );
        _formData.fields[valIndex].selectedvalue =
          datetmp !== null ? datetmp : null;
        console.log(_formData.fields);
      },
      numericTextBox: (event, data) => {
        //console.log("handleNumericChange From GetComponent");
        const valIndex = _formData.fields.findIndex(
          (item) => item.field === data.name
        );
        _formData.fields[valIndex].selectedvalue =
          event.value !== null ? event.value : 0;
        //console.log(_formData.fields);
      },
    };

    const { validationMessage, visited, ...others } = props;

    return (
      <div>
        <div>
          {props.type != "dropdown" && (
            <InputComponent
              props={props}
              onChangeCallback={handleInputComponentChange}
              defaultItem={InputFormCallback}
            />
          )}
          {props.type == "dropdown" && (
            <KendoDropDownList
              props={props}
              onChangeCallback={handleDropDownChange}
              defaultItem={InputFormCallback}
            />
          )}
        </div>
        {visited && validationMessage && <Error>{validationMessage}</Error>}
      </div>
    );
  };

  const InputComponent = ({ props, onChangeCallback, defaultItem }) => {
    const [numericValue, setNumericValue] = useState();
    const [selectedDate, setSelectedDate] = useState(null);
    const [inputValue, setInputValue] = useState("");
    useEffect(() => {
      if (defaultItem != {} && defaultItem != undefined) {
        if (props.type == "number") {
          const foundItem = defaultItem.data.find(
            (item) => item.field === props.cascadingData.field.field
          );
          //console.log(foundItem);
          if (foundItem != null) setNumericValue(foundItem.selectedvalue);
          else setNumericValue(0);
        }
        if (props.type == "input") {
          const foundItem = defaultItem.data.find(
            (item) => item.field === props.cascadingData.field.field
          );
          //console.log(foundItem);
          if (foundItem != null) setInputValue(foundItem.selectedvalue);
          else setInputValue("");
        }
      }
    }, [defaultItem]);

    useEffect(() => {}, []);

    const handleInputChange = (event) => {
      setInputValue(event.target.value);
      onChangeCallback.input(event, props);
    };

    const handleDateChange = (date) => {
      // console.log("DateChangeHandler",date);
      setSelectedDate(date);
      onChangeCallback.datePicker(date, props);
    };

    const handleNumericChange = (event) => {
      setNumericValue(event.value);
      onChangeCallback.numericTextBox(event, props);
    };
    return (
      <div>
        {props.type == "input" && (
          <div className="inp-div">
            <span className="inp-heading">{props.label}</span>
            <Input value={inputValue} onChange={handleInputChange} />
          </div>
        )}
        {props.type == "date" && (
          <div className="inp-div">
            <span className="inp-heading">{props.label}</span>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              format="dd/MM/yy"
              placeholder="Choose a date..."
            />
          </div>
        )}
        {props.type == "number" && (
          <div className="inp-div">
            <span className="inp-heading">{props.label}</span>
            <NumericTextBox
              defaultValue={0}
              value={numericValue}
              onChange={handleNumericChange}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Form
        onSubmitClick={handleInputFormEvents.handleSubmit}
        render={(formRenderProps) => (
          <FormElement style={{}}>
            <GridLayout rows={_rows} cols={_cols} gap={_gap}>
              {_formData.fields != null &&
                _formData.fields.map((field, index) => (
                  <GridLayoutItem
                    key={index}
                    col={parseInt(field.col)}
                    row={parseInt(field.row)}
                    colSpan={parseInt(field.span)}
                    className={"k-form-fieldset"}
                  >
                    <fieldset>
                      <div className="mb-1">
                        <Field
                          name={field.field}
                          type={field.type}
                          children={field.service}
                          component={(fieldProps) => (
                            <GetComponent
                              {...fieldProps}
                              cascadingData={{ field }}
                              onClear={clearForm}
                            />
                          )}
                          label={field.label}
                          //validator={nameValidator}
                        />
                      </div>
                    </fieldset>
                  </GridLayoutItem>
                ))}
            </GridLayout>
            <div className="btn-grps">
              {" "}
              <button
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary btn-GridAdd btn"
                onClick={formRenderProps.onSubmit}
              >
                {InputFormCallback.action}
              </button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button
                type="reset"
                className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary btn-2"
                onClick={() => {
                  handleInputFormEvents.onClear(formRenderProps);
                }}
              >
                Clear
              </button>
            </div>
          </FormElement>
        )}
      />
    </div>
  );
};

export const KendoDropDownList = ({ props, onChangeCallback, defaultItem }) => {
  const [dropdownData, setDropdownData] = useState([]);
  const [dropdownValue, setDropdownValue] = useState("");

  console.log("Kendo Dropdown");
  console.log("props", props);
  console.log("defaultItem", defaultItem);

  useEffect(() => {
    if (defaultItem != null) {
      const foundItem = defaultItem.data.find(
        (item) => item.field === props.cascadingData.field.field
      );
      // console.log(foundItem);
      if (foundItem != null) setDropdownValue(foundItem.selectedvalue);
      else setDropdownValue("");
      //(props.cascadingData.field.selectedvalue)
    }
  }, [defaultItem]);

  const fetchDropdownData = async () => {
    try {
      const response = await getItems(
        props.cascadingData.field.controller,
        "List" + props.children
      );
      const data = response;
      setDropdownData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchCasscadingDropDownData = async (body) => {
    try {
      const response = await getItems(
        "MasterData",
        "list" + props.children,
        body
      );
      const data = response;
      setDropdownData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDropdownOpen = () => {
    if (!props.cascadingData.field.isCasscaded) fetchDropdownData();
    else fetchCasscadingDropDownData(props.cascadingData.field.parentValue);
  };

  const handleDropdownChange = (event) => {
    setDropdownValue(event.target.value);
    props.cascadingData.field.selectedvalue = event.target.value;
    if (
      !props.cascadingData.field.isCasscaded &&
      props.cascadingData.field.isCasscaded !== undefined
    ) {
      props.cascadingData.field.cascaded.id = event.target.value.Id;
    }
    onChangeCallback(props);
  };

  if (dropdownData != [])
    return (
      <div className="inp-div">
        <span className="inp-heading">{props.label}</span>
        <DropDownList
          data={dropdownData}
          textField="Name"
          dataItemKey="Id"
          value={dropdownValue}
          onOpen={handleDropdownOpen}
          onChange={handleDropdownChange}
        />
      </div>
    );
};
