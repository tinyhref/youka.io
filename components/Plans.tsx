import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useUser } from "@clerk/clerk-react";
import {
  IntervalType,
  LemonMonthlyPlans,
  LemonAnnuallyPlans,
  Plan,
  SubscriptionObject,
} from "@/types";
import { cn, gotoPricing } from "@/lib/utils";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import client from "@/lib/client";
import useSubscription from "@/hooks/subscrption";
import { Fallback } from "./Fallback";
import { useNavigate } from "react-router-dom";
import { useMetadata } from "@/hooks/metadata";

export const intervals = [
  { value: "annually", label: "Annually" },
  { value: "monthly", label: "Monthly" },
];

export const suffixes: Record<IntervalType, string> = {
  monthly: "month",
  annually: "year",
};

export function Plans() {
  const { t, i18n } = useTranslation();
  const { subscription, isLoaded } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>(LemonMonthlyPlans);
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<Plan | undefined>();
  const { user } = useUser();
  const navigate = useNavigate();
  const userMetadata = useMetadata();

  useEffect(() => {
    if (subscription) {
      if (subscription.attributes.status !== "active") {
        gotoPricing({
          medium: "plans_page",
          lang: i18n.language,
          provider: userMetadata?.provider,
        });
        navigate("/");
        return;
      }
      const monthly = LemonMonthlyPlans.find(
        (p) => p.id === subscription.attributes.variant_id
      );
      monthly ? setPlans(LemonMonthlyPlans) : setPlans(LemonAnnuallyPlans);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription]);

  function handleChangeInterval(interval: IntervalType) {
    if (interval === "monthly") {
      setPlans(LemonMonthlyPlans);
    } else {
      setPlans(LemonAnnuallyPlans);
    }
  }

  async function handleChangePlan(plan: Plan) {
    if (!subscription) return;

    try {
      setProcessingPlan(plan);
      await client.changePlan(
        subscription.id,
        subscription.attributes.product_id,
        plan.id
      );
      await user?.reload();
      toast({
        variant: "success",
        title: "Plan changed successfully",
        description: "Your new plan is now active",
      });
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: "destructive",
          title: "Plan change failed",
          description: e.message,
        });
      }
    } finally {
      setProcessingPlan(undefined);
    }
  }

  function renderButtons(
    plan: Plan,
    subscription?: SubscriptionObject,
    highlight: boolean = false
  ) {
    const current = subscription?.attributes.variant_id === plan.id;
    let resumable = false;
    if (subscription?.attributes.ends_at) {
      const ends_at = new Date(subscription.attributes.ends_at);
      const now = new Date();
      resumable = ends_at > now;
    }

    const ChangePlanButton = () => (
      <Button
        disabled={Boolean(processingPlan || resumable)}
        onClick={() => handleChangePlan(plan)}
        variant={highlight ? "default" : "outline"}
        className={cn(
          "cursor-pointer",
          "w-full block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        )}
      >
        {t("Select plan")}
        {processingPlan?.id === plan.id && (
          <FontAwesomeIcon className="px-2" icon={faSpinner} spin />
        )}
      </Button>
    );

    if (subscription?.attributes.status === "active" && current) {
      return (
        <>
          <Button disabled className="w-full" variant="outline">
            {t("Current Plan")}
            {processingPlan?.id === plan.id && (
              <FontAwesomeIcon className="px-2" icon={faSpinner} spin />
            )}
          </Button>
        </>
      );
    }

    return <ChangePlanButton />;
  }

  if (!isLoaded) {
    return <Fallback />;
  }

  return (
    <div className="dark:bg-gray-900 py-2">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="mx-auto mt-6 max-w-2xl text-center text-lg text-primary-600">
            {t("comps.plans.title")}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <RadioGroup
            value={plans[0].interval}
            onChange={handleChangeInterval}
            className="grid grid-cols-2 gap-x-1 rounded-full bg-primary/5 p-1 text-center text-xs font-semibold leading-5 text-primary"
          >
            <RadioGroup.Label className="sr-only">
              Payment frequency
            </RadioGroup.Label>
            {intervals.map((option) => (
              <RadioGroup.Option
                key={option.value}
                value={option.value}
                className={({ checked }) =>
                  cn(
                    checked ? "bg-primary text-secondary" : "",
                    "cursor-pointer rounded-full px-2.5 py-1"
                  )
                }
              >
                <span>
                  {
                    // @ts-ignore
                    t(option.label, { defaultValue: "" })
                  }
                </span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <div className="isolate mx-auto m-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan) => {
            const current = subscription?.attributes.variant_id === plan.id;
            const highlight = subscription ? current : plan.mostPopular;

            return (
              <div
                key={plan.id}
                className={cn(
                  highlight ? "ring-2 ring-primary" : "ring-1 ring-primary/10",
                  "rounded-3xl p-8 xl:p-10"
                )}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    key={plan.id}
                    className="text-lg font-semibold leading-8 text-primary"
                  >
                    {
                      // @ts-ignore
                      t(plan.name, { defaultValue: "" })
                    }
                  </h3>
                  {!subscription && plan.mostPopular && (
                    <p className="rounded-full bg-primary text-secondary px-2.5 py-1 text-xs font-semibold leading-5">
                      {t("Most popular")}
                    </p>
                  )}
                  {subscription && current && (
                    <p className="rounded-full bg-primary text-secondary px-2.5 py-1 text-xs font-semibold leading-5">
                      {t("Current Plan")}
                    </p>
                  )}
                </div>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-primary">
                    ${plan.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-primary">
                    /{plan.interval === "annually" ? t("year") : t("month")}
                  </span>
                </p>
                <div className="text-xs text-zinc-500 pt-4">
                  {plan.interval === "monthly" ? (
                    <div>Billed every month</div>
                  ) : (
                    <>
                      <div className="text-red-600 text-sm mb-4">
                        Save 40% compared to the monthly plan
                      </div>
                      <span> Billed every year</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-zinc-500">VAT may apply</div>
                <div className="flex flex-col items-center mt-6">
                  {renderButtons(plan, subscription, highlight)}
                </div>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-primary xl:mt-10">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className="h-6 w-5 flex-none text-primary"
                        aria-hidden="true"
                      />
                      {
                        // @ts-ignore
                        t(feature, { defaultValue: "" })
                      }
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
