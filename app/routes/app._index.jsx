import {useEffect, useState} from "react";
import {json} from "@remix-run/node";
import {useActionData, useLoaderData, useNavigation, useSubmit} from "@remix-run/react";
import {AccountConnection, BlockStack, Button, Card, Divider, InlineGrid, Layout, Page, Text,} from "@shopify/polaris";
import {authenticate} from "../shopify.server";

export const loader = async ({ request }) => {
  const {admin} = await authenticate.admin(request);
  const response = await admin.graphql(
    `query{
      discountNodes(first: 20,query: "type:app"){
          nodes{
            id
            discount{
              ... on DiscountAutomaticApp{
                appDiscountType{
                  functionId
                }
              }
            }
          }

      }
    }`
  )

  const responseJson = await response.json();
  return responseJson.data.discountNodes?.nodes;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  var response = {};
  if(formData.get('action') === 'ENABLE'){

    var discount = {};
    let functionId = formData.get('discountId');
    if(functionId === '4ee8f8bd-2be5-4055-8907-44c9e3a8812d'){
      discount = {
        functionId: "4ee8f8bd-2be5-4055-8907-44c9e3a8812d",
        title: "Store Credit Discount",
        startsAt: new Date(),
        endsAt: null,
        combinesWith: {
          productDiscounts: true,
          orderDiscounts: true,
          shippingDiscounts: true,
        }
      };
    }

    response = await admin.graphql(
        `#graphql
      mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
        response: discountAutomaticAppCreate(automaticAppDiscount: $discount) {
          userErrors {
            code
            message
            field
          }
        }
      }`,
      {
        variables: {
          discount: discount
        }
      },
    );
  }else if(formData.get('action') === 'DISABLE'){
    response = await admin.graphql(
        `#graphql
      mutation discountAutomaticDelete($id: ID!) {
        response: discountAutomaticDelete(id: $id) {
          deletedAutomaticDiscountId
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: formData.get('discountId')
        },
      },
    );
  }


  const responseJson = await response.json();
  const errors = responseJson.data.response?.userErrors;
  return json({ errors });
};

export default function Index() {
  const nav = useNavigation();
  const actionData = useActionData();
  const discounts = useLoaderData();
  const submit = useSubmit();
  const [isEnabled,setIsEnabled] = useState(false);
  const [isEnabledStoreCredit,setIsEnabledStoreCredit] = useState(false);
  const [discountId,setDiscountId] = useState("");
  const [storeCreditDiscountId, setStoreCreditDiscountId] = useState("");

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  useEffect(() => {
    setIsEnabled(false);
    setIsEnabledStoreCredit(false);
    discounts.forEach((discount)=>{
      if(discount.discount.appDiscountType.functionId === '38566479-dce8-4edc-b0b1-eef2373b16b2'){
        setIsEnabled(true);
        setDiscountId(discount.id);
      }
      if(discount.discount.appDiscountType.functionId === '4ee8f8bd-2be5-4055-8907-44c9e3a8812d'){
        setIsEnabledStoreCredit(true);
        setStoreCreditDiscountId(discount.id);
      }
    })
  }, [discounts]);



  useEffect(() => {
    if (actionData?.errors?.length === 0) {
      shopify.toast.show("Discount Toggled",{});
    }else if(actionData?.errors?.length > 0){
      shopify.toast.show("Unable to Toggle Discount",{
        isError: true
      });

    }
  }, [actionData]);

  const toggleDiscount = (status,discountId) => {
    submit({action: status ? "DISABLE" : "ENABLE" , discountId: discountId}, { replace: true, method: "POST" });
  }

  return (
    <Page title={"Store Credit Discounts"}>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <div>
              <AccountConnection
                accountName={"Store Credit"}
                connected={isEnabledStoreCredit}
                title="Store Credit"

                action={{
                  content: isEnabledStoreCredit ? "Disable" : "Enable",
                  onAction: ()=>{
                    toggleDiscount(isEnabledStoreCredit,!isEnabledStoreCredit ? '4ee8f8bd-2be5-4055-8907-44c9e3a8812d' : storeCreditDiscountId)
                  },
                }}
                details={"The discount has been "+ (isEnabledStoreCredit ? "enabled" : "disabled")}
              />
            </div>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
