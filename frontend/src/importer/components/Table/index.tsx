import React, { createContext, useContext } from "react";
import { cn } from "../../../utils/cn";
import { CellProps, RowProps, TableProps } from "./types";
import Tooltip from "../Tooltip";

const TableContext = createContext<any>({});

export default function Table({
  data, // An array of objects with the data to be displayed
  keyAsId = "id", // Has to be a unique property in the data array to be used as key
  theme, // A CSS module object to style the table
  mergeThemes, // Should 'theme' be the only style applied (false) or be merged with the default style (true)
  highlightColumns, // Columns that should use the highlighted style
  hideColumns = ["id"], // Array of columns to be hidden in the display
  emptyState,
  heading,
  background = "zebra",
  columnWidths = [],
  columnAlignments = [],
  fixHeader = false,
  onRowClick,
}: TableProps): React.ReactElement {

  // TABLE HEADINGS
  // Hide column title if the item has an action (action button) or the title starts with underscore
  const modelDatum = data?.[0];
  const thead: any = modelDatum
    ? Object.keys(modelDatum).map((k) => {
        const value = modelDatum[k];

        if (k.indexOf("_") === 0) {
          return "";
        }

        if (typeof value === "object" && value?.captionInfo) {
          return { key: k, captionInfo: value.captionInfo };
        }

        return k;
      })
    : {};
  const context = {
    highlightColumns,
    hideColumns,
    columnWidths,
    columnAlignments,
  };

  if (!data || !data?.length) return <div className="text-center text-gray-500 py-8">{emptyState || null}</div>;

  const tableStyle = cn(
    "w-full border-collapse",
    background === "zebra" && "[&>div:nth-child(even)]:bg-gray-50",
    fixHeader && "relative"
  );

  const headingContent = heading ? (
    <div className="px-4 py-2 font-semibold text-lg border-b">{heading}</div>
  ) : (
    <div className="sticky top-0 bg-gray-100 font-semibold border-b" role="rowgroup">
      <Row datum={thead} isHeading={true} />
    </div>
  );

  return (
    <TableContext.Provider value={context}>
      <div className={tableStyle} role="table">
        {headingContent}
        <div className="divide-y divide-gray-200" role="rowgroup">
          {data.map((d, i) => {
            const key = keyAsId && d?.[keyAsId] ? d[keyAsId] : i;
            const props = { datum: d, onClick: onRowClick };
            return <Row {...props} key={key?.toString()} />;
          })}
        </div>
      </div>
      {!data.length && (
        <div className="text-center text-gray-500 py-8" role="empty-query">
          <p>Empty</p>
        </div>
      )}
    </TableContext.Provider>
  );
}

const Row = ({ datum, onClick, isHeading }: RowProps) => {
  const { highlightColumns, hideColumns, columnWidths, columnAlignments } = useContext(TableContext);

  const className = cn(
    "flex",
    onClick && "cursor-pointer hover:bg-gray-50",
    isHeading && "font-semibold"
  );
  return (
    <div className={className} role="row" onClick={() => onClick?.(datum)}>
      {Object.keys(datum)
        .filter((k) => !hideColumns.includes(datum[k]) && !hideColumns.includes(k))
        .map((k, i) => {
          // datum is the row
          // datum[k] is the content for the cell
          // If it is an object with the 'content' property, use that as content (can be JSX or a primitive)
          // Another 'raw' property with a primitive value is used to sort and search
          let content = (datum[k] as any)?.content || datum[k];
          const tooltip = (datum[k] as any)?.tooltip;
          const captionInfo = isHeading ? (datum[k] as any)?.captionInfo : null;
          const headingKey = isHeading ? (datum[k] as any)?.key : null;
          content = isHeading && captionInfo ? <Tooltip title={captionInfo}>{headingKey}</Tooltip> : content;
          const wrappedContent = content && typeof content === "string" ? <span>{content}</span> : content;

          const cellClass = cn(
            "px-4 py-2",
            highlightColumns?.includes(k) && "bg-blue-50 font-medium",
            !wrappedContent && "text-gray-400",
            typeof content !== "string" && "flex items-center"
          );

          const cellStyle = { width: columnWidths?.[i] || "auto", textAlign: columnAlignments?.[i] || "left" };

          return (
            <Cell key={k} cellClass={cellClass} cellStyle={cellStyle} tooltip={tooltip || ""}>
              {wrappedContent}
            </Cell>
          );
        })}
    </div>
  );
};

const Cell = ({ children, cellClass, cellStyle, tooltip }: CellProps) => {
  const cellProps = {
    className: cn("flex-1", cellClass, !children && "text-gray-400"),
    role: "cell",
    style: cellStyle,
    ...(tooltip ? { title: tooltip } : {}),
  };
  return <div {...cellProps}>{children}</div>;
};
