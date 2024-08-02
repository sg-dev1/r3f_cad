/** This component contains a list of all sketches presented to the user in the 3D modelling tool. */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectSelectedSketch, setSelectedSketch, setUpdatedSketchId } from '@/app/slices/modellingToolStateSlice';
import {
  deleteSketch,
  selectSketchs,
  setActiveSketch,
  setSketchVisibility,
  updatePlaneOffset,
} from '@/app/slices/sketchSlice';
import { Button, Flex, Form, GetRef, Input, InputRef, Popconfirm, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useContext, useEffect, useRef, useState } from 'react';

// --- (copied code, same as in ConstraintTable.tsx)
// Base on Editable Cells example
// https://ant.design/components/table#components-table-demo-edit-cell
// https://codepen.io/pen?editors=0010
// https://stackblitz.com/run?file=index.css,demo.tsx

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof DataType;
  record: DataType;
  handleSave: (record: DataType) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    // title: "Values", e.g. title of header
    // dataIndex: "v", as specified in columns array
    // record: the whole record of ConstraintType type
    // children: The html (ReactNode) return by render (for the v dataIndex) as specified in the columns arry
    //console.log('toggleEdit', title, dataIndex, record, children);

    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      let values = await form.validateFields();
      // Note: values contains the whole object as record

      console.log('values', values);
      console.log(typeof values[dataIndex]);
      if (typeof values[dataIndex] === 'string') {
        //console.log('values are string');
        const elements = values[dataIndex].split(',');
        values[dataIndex] = elements.map((elem: string) => {
          if ('zero' === elem) {
            return elem;
          }
          return parseFloat(elem);
        });
      }

      //console.log('save: values', values);

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;
// ---

interface DataType {
  key: string;
  id: number;
  name: string;
  plane: string;
  plane_offset: number;
}

const SketchTable = () => {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const sketches = useAppSelector(selectSketchs);
  const selectedSketch = useAppSelector(selectSelectedSketch);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const values: DataType[] = Object.entries(sketches).map(([key, value]) => ({
      key: String(value.id),
      id: value.id,
      name: value.name,
      plane: value.plane.plane,
      plane_offset: value.plane.offset,
    }));
    setTableData(values);
  }, [sketches]);

  useEffect(() => {
    setSelectedRowKey(String(selectedSketch));
  }, [selectedSketch]);

  // ---
  // here the editable columns need an editable property set

  const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      width: '15%',
      //sorter: (a, b) => a.id - b.id,
      //sortOrder: sortedInfo.columnKey === 'changedByUser' ? sortedInfo.order : null,
      //ellipsis: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
      //sorter: (a, b) => a.id - b.id,
      //sortOrder: sortedInfo.columnKey === 'changedByUser' ? sortedInfo.order : null,
      //ellipsis: true,
    },
    {
      title: 'Plane',
      dataIndex: 'plane',
      key: 'plane',
      width: '10%',
    },
    {
      title: 'Offset',
      dataIndex: 'plane_offset',
      key: 'plane_offset',
      width: '15%',
      editable: true,
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      width: '10%',
      render: (_, record) => {
        return (
          <Flex>
            <Button style={{ padding: '3px 5px' }} type="text" onClick={() => handleUpdate(record as DataType)}>
              <span className="material-symbols-outlined">edit</span>
            </Button>
            <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record as DataType)}>
              <span style={{ padding: '3px 5px' }} className="material-symbols-outlined">
                delete
              </span>
            </Popconfirm>
            <Button
              style={{ padding: '3px 5px' }}
              type="text"
              onClick={() => dispatch(setSketchVisibility({ id: record.id, visible: !sketches[record.id].isVisible }))}
            >
              <span className="material-symbols-outlined">
                {sketches[record.id]?.isVisible ? 'visibility_off' : 'visibility'}
                {/* visibility */}
              </span>
            </Button>
          </Flex>
        );
      },
    },
  ];

  const handleSave = (row: DataType) => {
    console.log('handleSave', row);
    //const { ['key']: removedKey, ['isError']: _, ...constraintData } = row;
    //dispatch(updateConstraint(constraintData));
    let planeOffset = row.plane_offset;
    if (Array.isArray(planeOffset) && planeOffset.length > 0) {
      planeOffset = planeOffset[0];
    }
    dispatch(updatePlaneOffset({ sketchId: row.id, offset: planeOffset }));
    dispatch(setUpdatedSketchId(row.id));
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  // ---

  const handleUpdate = (record: DataType) => {
    console.log('update', record);
    dispatch(setActiveSketch(record.id));
  };

  const handleDelete = (record: DataType) => {
    console.log('delete', record);
    dispatch(deleteSketch(record.id));
  };

  const handleRowClick = (record: DataType) => {
    setSelectedRowKey(record.key);
    dispatch(setSelectedSketch(record.id));
  };

  return (
    <Table
      style={{ overflow: 'auto' }}
      components={{
        body: {
          row: EditableRow,
          cell: EditableCell,
        },
      }}
      rowClassName={(record) => (record.key === selectedRowKey ? 'selected-row' : '')}
      pagination={false}
      //scroll={{ y: '35vh' }}
      columns={columns as ColumnTypes}
      dataSource={tableData}
      title={() => <b>Sketchs</b>}
      onRow={(record, rowIndex) => {
        return {
          onClick: (event) => {
            handleRowClick(record as DataType);
          },
        };
      }}
    />
  );
};

export default SketchTable;
