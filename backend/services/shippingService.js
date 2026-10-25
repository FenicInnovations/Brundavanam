const { shiprocket: srConfig } = require("../config/env");

class ShippingService {
  constructor() {
    this.email = (srConfig.email || process.env.SHIPROCKET_EMAIL || "").trim();
    this.password = (srConfig.password || process.env.SHIPROCKET_PASSWORD || "").trim();
    this.pickupLocation = srConfig.pickupLocation || "Primary";
    this.pickupPincode = srConfig.pickupPincode || "522002";
    this.token = null;
    this.tokenExpiry = null;
    this.isMock = !this.email || !this.password;

    if (this.isMock) {
      console.log("[ShippingService] Shiprocket credentials not set. Operating in MOCK mode.");
    }
  }

  /**
   * Fetch and cache JWT token from Shiprocket API
   */
  async getAuthToken() {
    if (this.isMock) return "mock_shiprocket_token";

    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email, password: this.password }),
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message || "Failed to authenticate with Shiprocket");
      }

      this.token = data.token;
      // Tokens expire in 10 days, cache for 9 days
      this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
      console.log("[ShippingService] Successfully authenticated with Shiprocket API");
      return this.token;
    } catch (err) {
      console.error("[ShippingService] Shiprocket login failed:", err.message);
      this.isMock = true;
      return "mock_shiprocket_token";
    }
  }

  /**
   * Helper for authenticated Shiprocket requests
   */
  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    const url = `https://apiv2.shiprocket.in/v1/external${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    let data = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { message: "Invalid JSON response from Shiprocket" };
    }
    return { ok: response.ok, status: response.status, data };
  }

  /**
   * Fetch registered pickup locations from Shiprocket account
   */
  async getPickupLocations() {
    if (this.isMock) {
      return [{ pickup_location: "Primary", is_primary_location: 1, pin_code: this.pickupPincode }];
    }

    try {
      const { ok, data } = await this.request("/settings/company/pickup");
      if (ok && data?.data?.shipping_address && Array.isArray(data.data.shipping_address)) {
        return data.data.shipping_address;
      }
      return [];
    } catch (err) {
      console.warn("[ShippingService] Failed to fetch pickup locations:", err.message);
      return [];
    }
  }

  /**
   * Resolve valid pickup location name from Shiprocket account
   * Auto-falls back to Primary/active registered location if configured name doesn't match
   */
  async resolvePickupLocation() {
    if (this.isMock) return this.pickupLocation || "Primary";

    const addresses = await this.getPickupLocations();
    if (!addresses || addresses.length === 0) {
      return this.pickupLocation || "Primary";
    }

    // 1. Check if configured location matches any registered location (case-insensitive)
    const exactMatch = addresses.find(
      (a) => a.pickup_location && a.pickup_location.toLowerCase().trim() === (this.pickupLocation || "").toLowerCase().trim()
    );
    if (exactMatch) {
      this.pickupLocation = exactMatch.pickup_location;
      if (exactMatch.pin_code) this.pickupPincode = String(exactMatch.pin_code).trim();
      return exactMatch.pickup_location;
    }

    // 2. Fall back to primary location or first active location
    const primary =
      addresses.find((a) => a.is_primary_location === 1) ||
      addresses.find((a) => a.status === 1) ||
      addresses[0];

    if (primary && primary.pickup_location) {
      console.log(
        `[ShippingService] Configured pickup location "${this.pickupLocation}" does not match Shiprocket account locations (${addresses.map((a) => `"${a.pickup_location}"`).join(", ")}). Auto-selecting "${primary.pickup_location}".`
      );
      this.pickupLocation = primary.pickup_location;
      if (primary.pin_code) this.pickupPincode = String(primary.pin_code).trim();
      return primary.pickup_location;
    }

    return this.pickupLocation || "Primary";
  }

  /**
   * Realistic Indian postal zone rates mapped to Shiprocket tariff model
   * Pickup: 500081 (Hyderabad) / 522002 (Guntur, AP)
   */
  _calculateFallbackZoneRates(pincode, weight = 0.5) {
    const pin = String(pincode).trim();
    const pin2 = parseInt(pin.substring(0, 2), 10);
    const pin3 = parseInt(pin.substring(0, 3), 10);

    // Extra weight beyond initial 500g (units of 500g)
    const extraWeightUnits = Math.max(0, Math.ceil((weight - 0.5) / 0.5));

    let zone = "D"; // Default Rest of India
    let courier1 = "Delhivery Surface Eco";
    let courier2 = "Blue Dart Priority Air";
    let baseRate = 49;
    let extraRate = 12;
    let etd1 = "5-8 business days";
    let etd2 = "2-3 business days";
    let days1 = 6;
    let days2 = 2;

    // Zone A: Local Hyderabad / Guntur intra-city
    if ([500, 501, 502, 520, 521, 522].includes(pin3)) {
      zone = "A";
      baseRate = 35;
      extraRate = 8;
      courier1 = "Delhivery Local Surface";
      courier2 = "Blue Dart Express Air";
      etd1 = "3-5 business days";
      etd2 = "1-2 business days";
      days1 = 4;
      days2 = 1;
    }
    // Zone B: Intra-state Andhra Pradesh & Telangana (50, 51, 52, 53)
    else if ([50, 51, 52, 53].includes(pin2)) {
      zone = "B";
      baseRate = 40;
      extraRate = 10;
      courier1 = "Delhivery Surface Eco";
      courier2 = "Blue Dart Priority Air";
      etd1 = "4-6 business days";
      etd2 = "1-2 business days";
      days1 = 5;
      days2 = 2;
    }
    // Zone C: South Region (Karnataka 56-59, Tamil Nadu 60-64, Kerala 67-69)
    else if (pin2 >= 56 && pin2 <= 69) {
      zone = "C";
      baseRate = 45;
      extraRate = 12;
      courier1 = "DTDC Surface Eco";
      courier2 = "Delhivery Express Air";
      etd1 = "5-7 business days";
      etd2 = "2-3 business days";
      days1 = 6;
      days2 = 2;
    }
    // Zone D: Western & Central (Maharashtra 40-49, Gujarat 36-39, MP 45-48, Goa 403)
    else if ((pin2 >= 40 && pin2 <= 49) || (pin2 >= 36 && pin2 <= 39)) {
      zone = "D";
      baseRate = 49;
      extraRate = 14;
      courier1 = "Shadowfax Surface Eco";
      courier2 = "Blue Dart Express Air";
      etd1 = "5-8 business days";
      etd2 = "2-3 business days";
      days1 = 6;
      days2 = 2;
    }
    // Zone E: Northern (Delhi 11, Haryana 12-13, Punjab 14-15, HP 17, UP 20-28, Rajasthan 30-34)
    else if (pin2 >= 11 && pin2 <= 34) {
      zone = "E";
      baseRate = 55;
      extraRate = 15;
      courier1 = "Delhivery Surface Eco";
      courier2 = "DTDC Express Air";
      etd1 = "6-8 business days";
      etd2 = "2-3 business days";
      days1 = 7;
      days2 = 2;
    }
    // Zone F: Eastern & North-Eastern (WB 70-74, Odisha 75-77, Bihar/Jharkhand 80-85, Assam/NE 78-79)
    else if (pin2 >= 70 && pin2 <= 85) {
      zone = "F";
      baseRate = 59;
      extraRate = 16;
      courier1 = "Ecom Express Surface";
      courier2 = "Delhivery Priority Air";
      etd1 = "6-9 business days";
      etd2 = "2-4 business days";
      days1 = 8;
      days2 = 3;
    }
    // Zone G: Special / Remote (J&K 18-19, Islands 744, remote NE 79)
    else if ([18, 19].includes(pin2) || pin3 === 744) {
      zone = "G";
      baseRate = 65;
      extraRate = 18;
      courier1 = "India Post Speed Surface";
      courier2 = "Blue Dart Priority Air";
      etd1 = "7-10 business days";
      etd2 = "3-5 business days";
      days1 = 9;
      days2 = 4;
    }

    const rate1 = Math.min(69, Math.round(baseRate + extraWeightUnits * extraRate));
    const rate2 = Math.min(99, Math.round(baseRate * 1.35 + extraWeightUnits * (extraRate * 1.25)));

    return [
      {
        courier_name: courier1,
        courier_company_id: 10,
        rate: rate1,
        etd: etd1,
        estimated_delivery_days: days1,
        is_air: false,
        zone,
      },
      {
        courier_name: courier2,
        courier_company_id: 12,
        rate: rate2,
        etd: etd2,
        estimated_delivery_days: days2,
        is_air: true,
        zone,
      },
    ];
  }

  /**
   * Calculate shipping rates for a specific destination
   * Requires weight, delivery_postcode, declared_value
   */
  async calculateShippingRates({ deliveryPincode, weight = 0.5, cod = 0, declaredValue = 0 }) {
    const pin = String(deliveryPincode).trim();
    if (!pin || !/^\d{6}$/.test(pin)) {
      throw new Error("Invalid 6-digit destination pincode");
    }

    const token = await this.getAuthToken();
    if (!this.isMock && token && token !== "mock_shiprocket_token") {
      try {
        const queryParams = new URLSearchParams({
          pickup_postcode: this.pickupPincode,
          delivery_postcode: pin,
          weight: Math.max(0.2, weight),
          cod: 0, // No Cash On Delivery
          declared_value: declaredValue,
        }).toString();

        const { ok, data } = await this.request(`/courier/serviceability/?${queryParams}`, {
          method: "GET",
        });

        if (ok && data?.data?.available_courier_companies?.length > 0) {
          return data.data.available_courier_companies.map((c) => {
            const rawEtd = c.etd || c.estimated_delivery_days || 3;
            const daysNum = parseInt(rawEtd, 10) || 3;
            const etdLabel = String(rawEtd).toLowerCase().includes("day")
              ? String(rawEtd).trim()
              : `${daysNum} business days`;

            return {
              courier_name: c.courier_name || "Shiprocket Courier",
              courier_company_id: c.courier_company_id || 10,
              rate: Math.round(parseFloat(c.rate) || 60),
              etd: etdLabel,
              estimated_delivery_days: daysNum,
              is_air: c.is_air === 1 || c.mode === "air" || /air|express|priority/i.test(c.courier_name || ""),
            };
          });
        }
      } catch (err) {
        console.warn("[ShippingService] Live serviceability query failed, using tariff zone calculation:", err.message);
      }
    }

    // Dynamic Indian postal zone rates
    return this._calculateFallbackZoneRates(pin, weight);
  }

  /**
   * Create an adhoc shipment order on Shiprocket
   */
  async createShipmentOrder(order) {
    await this.getAuthToken();
    if (this.isMock) {
      const mockShiprocketOrderId = Math.floor(10000000 + Math.random() * 90000000);
      const mockShipmentId = Math.floor(20000000 + Math.random() * 90000000);
      const mockAwb = `SRKT${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      return {
        isMock: true,
        shiprocketOrderId: mockShiprocketOrderId,
        shipmentId: mockShipmentId,
        awbCode: mockAwb,
        courierName: "Delhivery Surface",
        courierCompanyId: 10,
        trackingUrl: `https://shiprocket.co/tracking/${mockAwb}`,
        labelUrl: `https://shiprocket.co/mock-label-${mockShipmentId}.pdf`,
        currentStatus: "AWB Assigned",
      };
    }

    try {
      const dateFormatted = new Date(order.createdAt || Date.now())
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const activePickupLocation = await this.resolvePickupLocation();

      const orderPayload = {
        order_id: order.orderNumber,
        order_date: dateFormatted,
        pickup_location: activePickupLocation,
        billing_customer_name: order.billingAddress.fullName,
        billing_last_name: "",
        billing_address: order.billingAddress.line1,
        billing_address_2: order.billingAddress.line2 || "",
        billing_city: order.billingAddress.city,
        billing_pincode: order.billingAddress.postalCode,
        billing_state: order.billingAddress.state,
        billing_country: order.billingAddress.country || "India",
        billing_email: order.billingAddress.email || order.shippingAddress.email || "customer@brundavanam.org",
        billing_phone: order.billingAddress.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item) => ({
          name: item.name,
          sku: item.sku || `PROD-${item.product}`,
          units: item.quantity,
          selling_price: item.finalPrice,
          discount: item.price > item.finalPrice ? item.price - item.finalPrice : 0,
          tax: item.gstAmount || 0,
          hsn: Number(item.hsnCode) || 4059020,
        })),
        payment_method: order.payment.provider === "cod" ? "COD" : "Prepaid",
        sub_total: order.pricing.grandTotal,
        length: order.shipping?.length || (order.shipping?.weight > 1.5 ? 22 : (order.shipping?.weight > 0.5 ? 16 : 12)),
        breadth: order.shipping?.breadth || (order.shipping?.weight > 1.5 ? 18 : (order.shipping?.weight > 0.5 ? 14 : 10)),
        height: order.shipping?.height || (order.shipping?.weight > 1.5 ? 14 : (order.shipping?.weight > 0.5 ? 10 : 6)),
        weight: Math.max(0.2, Math.round((order.shipping?.weight || 0.5) * 100) / 100),
      };

      let { ok, data } = await this.request("/orders/create/adhoc", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      // Handle pickup location mismatch gracefully
      if (!ok && data?.message && /pickup location/i.test(data.message)) {
        console.warn(`[ShippingService] Pickup location "${orderPayload.pickup_location}" rejected by Shiprocket. Attempting automatic location recovery...`);
        const addresses = await this.getPickupLocations();
        const primary =
          addresses.find((a) => a.is_primary_location === 1) ||
          addresses.find((a) => a.status === 1) ||
          addresses[0];

        if (primary?.pickup_location && primary.pickup_location !== orderPayload.pickup_location) {
          console.log(`[ShippingService] Retrying adhoc order with registered Shiprocket location: "${primary.pickup_location}"`);
          orderPayload.pickup_location = primary.pickup_location;
          this.pickupLocation = primary.pickup_location;
          if (primary.pin_code) this.pickupPincode = String(primary.pin_code).trim();
          const retryRes = await this.request("/orders/create/adhoc", {
            method: "POST",
            body: JSON.stringify(orderPayload),
          });
          ok = retryRes.ok;
          data = retryRes.data;
        }

        if (!ok) {
          if (!addresses || addresses.length === 0) {
            throw new Error(
              "No Pickup Address found in your Shiprocket account. Please log in to Shiprocket Dashboard (Settings > Pickup Address) and add a pickup address."
            );
          }
          const availableNames = addresses.map((a) => `"${a.pickup_location}"`).join(", ");
          throw new Error(
            `Wrong Pickup location entered. Your Shiprocket account has: ${availableNames}. Please set SHIPROCKET_PICKUP_LOCATION in backend .env to one of these nicknames.`
          );
        }
      }

      if (!ok || !data?.order_id) {
        throw new Error(data?.message || (data?.errors ? JSON.stringify(data.errors) : "Shiprocket failed to create order"));
      }

      const shiprocketOrderId = data.order_id;
      const shipmentId = data.shipment_id;

      // Auto-assign AWB with the cheapest courier (or customer chosen courier) to save money
      let targetCourierId = order.shipping?.courierCompanyId || null;
      if (!targetCourierId && !this.isMock) {
        try {
          const available = await this.calculateShippingRates({
            deliveryPincode: order.shippingAddress.postalCode,
            weight: order.shipping?.weight || 0.5,
            declaredValue: order.pricing.grandTotal,
          });
          if (available && available.length > 0) {
            const cheapest = [...available].sort((a, b) => a.rate - b.rate)[0];
            targetCourierId = cheapest.courier_company_id;
            console.log(`[ShippingService] Auto-selected cheapest courier ${cheapest.courier_name} (ID: ${targetCourierId}, ₹${cheapest.rate}) for order ${order.orderNumber}`);
          }
        } catch (cErr) {
          console.warn("[ShippingService] Could not resolve cheapest courier:", cErr.message);
        }
      }

      let awbData = null;
      let labelUrl = "";
      try {
        awbData = await this.generateAWB({ shipmentId, courierId: targetCourierId });
        if (awbData?.awbCode) {
          try {
            const labelRes = await this.generateLabel(shipmentId);
            labelUrl = labelRes?.labelUrl || "";
          } catch (lblErr) {
            console.warn("[ShippingService] Label generation deferred:", lblErr.message);
          }
        }
      } catch (awbErr) {
        console.warn("[ShippingService] AWB auto-assignment deferred:", awbErr.message);
      }

      return {
        shiprocketOrderId,
        shipmentId,
        awbCode: awbData?.awbCode || "",
        courierName: awbData?.courierName || order.shipping?.courierName || "Delhivery Surface",
        courierCompanyId: awbData?.courierCompanyId || targetCourierId || 10,
        trackingUrl: awbData?.awbCode ? `https://shiprocket.co/tracking/${awbData.awbCode}` : "",
        labelUrl: labelUrl || "",
        currentStatus: awbData?.awbCode ? "AWB Assigned" : "Order Created",
      };
    } catch (err) {
      console.error("[ShippingService] Failed to create Shiprocket order:", err);
      throw new Error(`Shiprocket Order Error: ${err.message}`);
    }
  }

  /**
   * Generate / Assign AWB for shipment
   */
  async generateAWB({ shipmentId, courierId = null }) {
    await this.getAuthToken();
    if (this.isMock) {
      const mockAwb = `SRKT${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      return {
        awbCode: mockAwb,
        courierName: "Delhivery Air",
        courierCompanyId: courierId || 10,
        isMock: true,
      };
    }

    const payload = { shipment_id: shipmentId };
    if (courierId) payload.courier_id = courierId;

    const { ok, data } = await this.request("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!ok || !data?.response?.data?.awb_code) {
      throw new Error(data.message || "Failed to assign AWB from Shiprocket");
    }

    const responseData = data.response.data;
    return {
      awbCode: responseData.awb_code,
      courierCompanyId: responseData.courier_company_id,
      courierName: responseData.courier_name,
    };
  }

  /**
   * Generate printable shipping label
   */
  async generateLabel(shipmentId) {
    await this.getAuthToken();
    if (this.isMock) {
      return {
        labelUrl: `https://shiprocket.co/mock-label-${shipmentId}.pdf`,
        isMock: true,
      };
    }

    const { ok, data } = await this.request("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });

    if (!ok || !data.label_url) {
      throw new Error(data.message || "Failed to generate label");
    }

    return { labelUrl: data.label_url };
  }

  /**
   * Track shipment in real time using AWB code
   */
  async trackShipment(awbCode) {
    await this.getAuthToken();
    if (this.isMock || !awbCode) {
      return {
        awbCode,
        currentStatus: "IN TRANSIT",
        location: "Guntur Hub",
        activity: "Consignment scanned at facility",
        updatedAt: new Date(),
        isMock: true,
      };
    }

    const { ok, data } = await this.request(`/courier/track/awb/${awbCode}`);
    if (!ok || !data.tracking_data) {
      return {
        awbCode,
        currentStatus: "Tracking Not Available",
        history: [],
      };
    }

    const track = data.tracking_data;
    const shipmentTrack = track.shipment_track?.[0] || {};
    const rawStatus = (shipmentTrack.current_status || "").trim();
    const statusCode = Number(track.shipment_status || shipmentTrack.shipment_status || 0);

    let currentStatus = rawStatus;
    if (!currentStatus) {
      if (statusCode === 7) currentStatus = "DELIVERED";
      else if (statusCode === 17) currentStatus = "OUT FOR DELIVERY";
      else if (statusCode === 18) currentStatus = "IN TRANSIT";
      else if (statusCode === 6) currentStatus = "SHIPPED";
      else if (statusCode === 42) currentStatus = "PICKED UP";
      else currentStatus = "IN TRANSIT";
    }

    const edd =
      shipmentTrack.edd ||
      shipmentTrack.expected_date ||
      track.etd ||
      track.expected_date ||
      "";

    return {
      awbCode,
      currentStatus,
      statusCode,
      courierName: shipmentTrack.courier_name || "",
      etd: edd,
      history: (track.shipment_track_activities || []).map((act) => ({
        status: act.status,
        activity: act.activity,
        location: act.location,
        date: new Date(act.date),
      })),
    };
  }

  /**
   * Create Reverse Pickup Shipment with Shiprocket
   */
  async createReturnShipment(order, { reason = "Customer Return", pickupAddress = null }) {
    await this.getAuthToken();
    const returnAddress = pickupAddress || order.shippingAddress;
    const warehousePincode = this.pickupPincode || "500081";

    if (this.isMock) {
      const mockReturnOrderId = Math.floor(30000000 + Math.random() * 90000000);
      const mockReturnShipmentId = Math.floor(40000000 + Math.random() * 90000000);
      const mockReturnAwb = `SRKT-RET-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      return {
        isMock: true,
        shiprocketOrderId: mockReturnOrderId,
        shipmentId: mockReturnShipmentId,
        awbCode: mockReturnAwb,
        courierName: "Shiprocket Reverse Logistics (Delhivery)",
        courierCompanyId: 10,
        trackingUrl: `https://shiprocket.co/tracking/${mockReturnAwb}`,
        labelUrl: `https://shiprocket.co/mock-return-label-${mockReturnShipmentId}.pdf`,
        currentStatus: "Reverse Pickup Scheduled",
      };
    }

    try {
      const dateFormatted = new Date().toISOString().slice(0, 19).replace("T", " ");

      const payload = {
        order_id: `RET-${order.orderNumber}`,
        order_date: dateFormatted,
        channel_id: "",
        pickup_customer_name: returnAddress.fullName,
        pickup_last_name: "",
        pickup_address: returnAddress.line1,
        pickup_address_2: returnAddress.line2 || "",
        pickup_city: returnAddress.city,
        pickup_state: returnAddress.state,
        pickup_country: returnAddress.country || "India",
        pickup_pincode: returnAddress.postalCode,
        pickup_email: returnAddress.email || order.user?.email || "customer@brundavanam.org",
        pickup_phone: returnAddress.phone,
        shipping_customer_name: "Brundavanam Goshala Warehouse",
        shipping_address: "Sree Raghvendra Brundavanam Garellavalasa, Manyam Parvathipuram Dist",
        shipping_city: "Salur",
        shipping_state: "Andhra Pradesh",
        shipping_country: "India",
        shipping_pincode: "535592",
        shipping_email: "brundavanamgaushala@gmail.com",
        shipping_phone: "9492602499",
        order_items: (order.items || []).map((item) => ({
          name: item.name,
          sku: item.sku || `PROD-${item.product}`,
          units: item.quantity,
          selling_price: item.finalPrice,
          discount: 0,
          tax: item.gstAmount || 0,
          hsn: Number(item.hsnCode) || 4059020,
        })),
        payment_method: "Prepaid",
        sub_total: order.pricing.grandTotal,
        length: 15,
        breadth: 15,
        height: 15,
        weight: 1.0,
      };

      const { ok, data } = await this.request("/orders/create/return", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!ok) {
        const adhocRes = await this.request("/orders/create/adhoc", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!adhocRes.ok) {
          throw new Error(data?.message || adhocRes.data?.message || "Failed to schedule return shipment in Shiprocket");
        }
        return {
          shiprocketOrderId: adhocRes.data.order_id,
          shipmentId: adhocRes.data.shipment_id,
          awbCode: `SRKT-RET-${adhocRes.data.shipment_id}`,
          courierName: "Shiprocket Reverse (Delhivery)",
          courierCompanyId: 10,
          trackingUrl: `https://shiprocket.co/tracking/${adhocRes.data.shipment_id}`,
          currentStatus: "Reverse Pickup Scheduled",
        };
      }

      const returnShipmentId = data.shipment_id || data.return_order_id;
      return {
        shiprocketOrderId: data.order_id || returnShipmentId,
        shipmentId: returnShipmentId,
        awbCode: data.awb_code || `SRKT-RET-${returnShipmentId}`,
        courierName: data.courier_name || "Shiprocket Reverse (Delhivery)",
        courierCompanyId: data.courier_company_id || 10,
        trackingUrl: data.awb_code ? `https://shiprocket.co/tracking/${data.awb_code}` : "",
        currentStatus: "Reverse Pickup Scheduled",
      };
    } catch (err) {
      console.error("[ShippingService] Failed to create Shiprocket return order:", err.message);
      const mockReturnAwb = `SRKT-RET-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      return {
        isMock: true,
        shiprocketOrderId: Math.floor(30000000 + Math.random() * 90000000),
        shipmentId: Math.floor(40000000 + Math.random() * 90000000),
        awbCode: mockReturnAwb,
        courierName: "Shiprocket Reverse (Delhivery)",
        courierCompanyId: 10,
        trackingUrl: `https://shiprocket.co/tracking/${mockReturnAwb}`,
        currentStatus: "Reverse Pickup Scheduled",
      };
    }
  }
}

module.exports = new ShippingService();

