export interface AsyncSelectResolvedOption {
  value: string | number;
}

export interface LoadMissingSelectedOptionsParams<
  Row extends Record<string, any>,
  Option extends AsyncSelectResolvedOption,
> {
  activeValues: Array<string | number>;
  selectedValues: Array<string | number>;
  loadRows: () => Promise<Row[]>;
  resolveValue: (row: Row) => string | number;
  toOption: (row: Row) => Option;
}

/******************************** AsyncSelect 工具方法 ********************************/

// 从候选数据里补齐缺失的已选项，确保回显不依赖用户先展开下拉
export async function loadMissingSelectedOptions<
  Row extends Record<string, any>,
  Option extends AsyncSelectResolvedOption,
>({
  activeValues,
  selectedValues,
  loadRows,
  resolveValue,
  toOption,
}: LoadMissingSelectedOptionsParams<Row, Option>): Promise<Option[]> {
  const missingValues = activeValues.filter(
    (value) => !selectedValues.includes(value)
  );

  if (!missingValues.length) {
    return [];
  }

  const missingValueSet = new Set(missingValues);
  const rows = await loadRows();
  const options: Option[] = [];

  for (const row of rows) {
    const value = resolveValue(row);
    if (!missingValueSet.has(value)) {
      continue;
    }

    const option = toOption(row);
    if (!options.find((item) => item.value === option.value)) {
      options.push(option);
    }
  }

  return options;
}
