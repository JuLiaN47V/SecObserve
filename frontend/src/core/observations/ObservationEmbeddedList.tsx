import { Stack } from "@mui/material";
import { Fragment, useEffect } from "react";
import {
    AutocompleteInput,
    BooleanField,
    ChipField,
    DatagridConfigurable,
    FilterForm,
    FunctionField,
    Identifier,
    ListContextProvider,
    NullableBooleanInput,
    NumberField,
    ReferenceInput,
    SelectColumnsButton,
    TextField,
    TextInput,
    TopToolbar,
    useListController,
} from "react-admin";
import { useNavigate } from "react-router";

import { PERMISSION_OBSERVATION_ASSESSMENT, PERMISSION_OBSERVATION_DELETE } from "../../access_control/types";
import { CustomPagination } from "../../commons/custom_fields/CustomPagination";
import { SeverityField } from "../../commons/custom_fields/SeverityField";
import { humanReadableDate } from "../../commons/functions";
import { AutocompleteInputMedium } from "../../commons/layout/themes";
import { getSettingListSize } from "../../commons/user_settings/functions";
import {
    AGE_CHOICES,
    OBSERVATION_SEVERITY_CHOICES,
    OBSERVATION_STATUS_CHOICES,
    OBSERVATION_STATUS_OPEN,
    Observation,
    Product,
} from "../types";
import ObservationBulkAssessment from "./ObservationBulkAssessment";
import ObservationBulkDeleteButton from "./ObservationBulkDeleteButton";
import { IDENTIFIER_OBSERVATION_EMBEDDED_LIST, setListIdentifier } from "./functions";

function listFilters(product: Product) {
    return [
        <ReferenceInput
            source="branch"
            reference="branches"
            sort={{ field: "name", order: "ASC" }}
            filter={{ product: product.id }}
            alwaysOn
        >
            <AutocompleteInputMedium optionText="name" label="Branch / Version" />
        </ReferenceInput>,
        <TextInput source="title" alwaysOn />,
        <AutocompleteInput
            source="current_severity"
            label="Severity"
            choices={OBSERVATION_SEVERITY_CHOICES}
            alwaysOn
        />,
        <AutocompleteInput source="current_status" label="Status" choices={OBSERVATION_STATUS_CHOICES} alwaysOn />,
        <ReferenceInput
            source="origin_service"
            reference="services"
            sort={{ field: "name", order: "ASC" }}
            filter={{ product: product.id }}
            alwaysOn
        >
            <AutocompleteInputMedium label="Service" optionText="name" />
        </ReferenceInput>,
        <TextInput source="origin_component_name_version" label="Component" alwaysOn />,
        <TextInput source="origin_docker_image_name_tag_short" label="Container" alwaysOn />,
        <TextInput source="origin_endpoint_hostname" label="Host" alwaysOn />,
        <TextInput source="origin_source_file" label="Source" alwaysOn />,
        <TextInput source="origin_cloud_qualified_resource" label="Resource" alwaysOn />,
        <TextInput source="scanner" alwaysOn />,
        <AutocompleteInputMedium source="age" choices={AGE_CHOICES} alwaysOn />,
        <TextInput source="upload_filename" label="Filename" />,
        <TextInput source="api_configuration_name" label="API configuration" />,
        <NullableBooleanInput source="has_potential_duplicates" label="Duplicates" alwaysOn />,
    ];
}

const ShowObservations = (id: any) => {
    return "../../../../observations/" + id + "/show";
};

type ObservationsEmbeddedListProps = {
    product: any;
};

const BulkActionButtons = (product: any) => (
    <Fragment>
        {product.product.permissions.includes(PERMISSION_OBSERVATION_ASSESSMENT) && (
            <ObservationBulkAssessment product={product.product} />
        )}
        {product.product.permissions.includes(PERMISSION_OBSERVATION_DELETE) && (
            <ObservationBulkDeleteButton product={product.product} />
        )}
    </Fragment>
);

const ListActions = () => (
    <TopToolbar>
        <SelectColumnsButton preferenceKey="observations.embedded" />
    </TopToolbar>
);

const ObservationsEmbeddedList = ({ product }: ObservationsEmbeddedListProps) => {
    setListIdentifier(IDENTIFIER_OBSERVATION_EMBEDDED_LIST);

    const navigate = useNavigate();
    function get_observations_url(branch_id: Identifier): string {
        return `?displayedFilters=%7B%7D&filter=%7B%22current_status%22%3A%22Open%22%2C%22branch%22%3A${branch_id}%7D&order=ASC&sort=current_severity`;
    }
    useEffect(() => {
        const current_product_id = localStorage.getItem("observationembeddedlist.product");
        if (current_product_id == null || Number(current_product_id) !== product.id) {
            localStorage.removeItem("RaStore.observations.embedded");
            localStorage.setItem("observationembeddedlist.product", product.id);
            navigate(get_observations_url(product.repository_default_branch));
        }
    }, [product, navigate]);

    const listContext = useListController({
        filter: { product: Number(product.id) },
        perPage: 25,
        resource: "observations",
        sort: { field: "current_severity", order: "ASC" },
        filterDefaultValues: { current_status: OBSERVATION_STATUS_OPEN, branch: product.repository_default_branch },
        disableSyncWithLocation: false,
        storeKey: "observations.embedded",
    });

    if (listContext.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <ListContextProvider value={listContext}>
            <div style={{ width: "100%" }}>
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="flex-end">
                    <FilterForm filters={listFilters(product)} />
                    <ListActions />
                </Stack>
                <DatagridConfigurable
                    size={getSettingListSize()}
                    sx={{ width: "100%" }}
                    rowClick={ShowObservations}
                    bulkActionButtons={
                        product &&
                        (product.permissions.includes(PERMISSION_OBSERVATION_ASSESSMENT) ||
                            product.permissions.includes(PERMISSION_OBSERVATION_DELETE)) && (
                            <BulkActionButtons product={product} />
                        )
                    }
                    resource="observations"
                    preferenceKey="observations.embedded"
                >
                    <TextField source="branch_name" label="Branch / Version" />
                    <TextField source="title" />
                    <SeverityField source="current_severity" />
                    <ChipField source="current_status" label="Status" />
                    <NumberField source="epss_score" label="EPSS" />
                    <TextField source="origin_service_name" label="Service" />
                    <TextField source="origin_component_name_version" label="Component" />
                    <TextField source="origin_docker_image_name_tag_short" label="Container" />
                    <TextField source="origin_endpoint_hostname" label="Host" />
                    <TextField source="origin_source_file" label="Source" />
                    <TextField source="origin_cloud_qualified_resource" label="Resource" />
                    <TextField source="scanner_name" label="Scanner" />
                    <FunctionField<Observation>
                        label="Age"
                        sortBy="last_observation_log"
                        render={(record) => (record ? humanReadableDate(record.last_observation_log) : "")}
                    />
                    <BooleanField source="has_potential_duplicates" label="Dupl." />
                </DatagridConfigurable>
                <CustomPagination />
            </div>
        </ListContextProvider>
    );
};

export default ObservationsEmbeddedList;
